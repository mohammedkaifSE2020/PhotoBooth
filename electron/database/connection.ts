import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import log from "electron-log";
import fs from "fs";

let db: Database.Database | null = null;

export function getDatabasePath(): string {
  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "photobooth_dev.db");
  log.info(`Database path resolved to: ${dbPath}`);
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return dbPath;
}

export async function initializeDatabase(): Promise<Database.Database> {
  if (db) {
    return db;
  }

  try {
    const dbPath = getDatabasePath();
    log.info(`Initializing database at: ${dbPath}`);
    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
    });

    db.pragma("foreign_keys = ON");

    db.pragma("journal_mode = WAL");

    await runMigrations(db);

    log.info('Database initialized successfully');
    return db;
  } catch (error) {
    log.error('Failed to initialize database:', error);
    throw error;
  }
}

//get database instance
export function getDatabase(): Database.Database {
  if (!db) {
    log.error('Database not initialized. Call initializeDatabase() first.');
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

//close the database connnection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    log.info('Database connection closed.');
  }
}

//run database migrations
async function runMigrations(database: Database.Database): Promise<void> {
  // Create migrations table if it doesn't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrations = getMigrations();

  for (const migration of migrations) {
    const applied = database
      .prepare('SELECT name FROM migrations WHERE name = ?')
      .get(migration.name);

    if (!applied) {
      log.info(`Running migration: ${migration.name}`);

      database.transaction(() => {
        database.exec(migration.sql);
        database
          .prepare('INSERT INTO migrations (name) VALUES (?)')
          .run(migration.name);
      })();

      log.info(`Migration completed: ${migration.name}`);
    }
  }
}

/**
 * Define database migrations
 */
function getMigrations() {
  return [
    {
      name: '001_initial_schema',
      sql: `
        -- Settings table
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          camera_device_id TEXT,
          resolution TEXT DEFAULT '1920x1080',
          countdown_duration INTEGER DEFAULT 3,
          enable_flash BOOLEAN DEFAULT 1,
          enable_sound BOOLEAN DEFAULT 1,
          save_directory TEXT,
          photo_format TEXT DEFAULT 'jpg',
          photo_quality INTEGER DEFAULT 95,
          printer_id TEXT,
          auto_print BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Sessions table
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          name TEXT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          ended_at DATETIME,
          photo_count INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled'))
        );

        -- Photos table
        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          filename TEXT NOT NULL,
          filepath TEXT NOT NULL,
          thumbnail_path TEXT,
          width INTEGER,
          height INTEGER,
          file_size INTEGER,
          taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          layout_type TEXT DEFAULT 'single',
          has_overlay BOOLEAN DEFAULT 0,
          has_filter BOOLEAN DEFAULT 0,
          metadata TEXT,
          FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
        );

        -- Templates table
        CREATE TABLE IF NOT EXISTS templates (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          layout_type TEXT NOT NULL,
          frame_path TEXT,
          overlay_data TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Print jobs table
        CREATE TABLE IF NOT EXISTS print_jobs (
          id TEXT PRIMARY KEY,
          photo_id TEXT NOT NULL,
          printer_id TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'printing', 'completed', 'failed', 'cancelled')),
          copies INTEGER DEFAULT 1,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(session_id);
        CREATE INDEX IF NOT EXISTS idx_photos_taken_at ON photos(taken_at DESC);
        CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
        CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);

        -- Insert default settings
        INSERT OR IGNORE INTO settings (id) VALUES (1);
      `,
    },
    {
      name: '002_add_analytics',
      sql: `
        -- Analytics table for tracking usage
        CREATE TABLE IF NOT EXISTS analytics_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          event_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(created_at DESC);
      `,
    },
    {
      name: '003_Templates_and_Printing_Support',
      sql: `ALTER TABLE templates ADD COLUMN background_color TEXT DEFAULT '#ffffff';
            ALTER TABLE templates ADD COLUMN width INTEGER DEFAULT 1800;
            ALTER TABLE templates ADD COLUMN height INTEGER DEFAULT 1200;
            ALTER TABLE templates ADD COLUMN text_overlays TEXT;
            ALTER TABLE templates ADD COLUMN is_default BOOLEAN DEFAULT 0;
            ALTER TABLE templates ADD COLUMN thumbnail_path TEXT;

            CREATE TABLE IF NOT EXISTS print_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            default_printer_id TEXT,
            paper_size TEXT DEFAULT '4x6', -- '4x6', '6x2', 'polaroid', '8x10'
            paper_orientation TEXT DEFAULT 'portrait', -- 'portrait', 'landscape'
            print_quality TEXT DEFAULT 'high', -- 'draft', 'normal', 'high'
            copies INTEGER DEFAULT 1,
            auto_print BOOLEAN DEFAULT 0,
            enable_print_preview BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

        -- Print jobs table (enhanced)
        ALTER TABLE print_jobs ADD COLUMN template_id TEXT;
        ALTER TABLE print_jobs ADD COLUMN paper_size TEXT DEFAULT '4x6';
        ALTER TABLE print_jobs ADD COLUMN print_data TEXT;

        -- Insert default print settings
        INSERT OR IGNORE INTO print_settings (id) VALUES (1);

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);
        CREATE INDEX IF NOT EXISTS idx_templates_layout ON templates(layout_type);
        CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON print_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_print_jobs_created ON print_jobs(created_at DESC);  `
    }
  ];
}

export default {
  initialize: initializeDatabase,
  get: getDatabase,
  close: closeDatabase,
};