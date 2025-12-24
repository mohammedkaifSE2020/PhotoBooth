"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabasePath = getDatabasePath;
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const fs_1 = __importDefault(require("fs"));
let db = null;
function getDatabasePath() {
    const userDataPath = electron_1.app.getPath("userData");
    const dbPath = path_1.default.join(userDataPath, "photobooth_dev.db");
    const dbDir = path_1.default.dirname(dbPath);
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    return dbPath;
}
async function initializeDatabase() {
    if (db) {
        return db;
    }
    try {
        const dbPath = getDatabasePath();
        electron_log_1.default.info(`Initializing database at: ${dbPath}`);
        db = new better_sqlite3_1.default(dbPath, {
            verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
        });
        electron_log_1.default.info(`Database initialized at ${dbPath}`);
        db.pragma("foreign_keys = ON");
        db.pragma("journal_mode = WAL");
        await runMigrations(db);
        electron_log_1.default.info('Database initialized successfully');
        return db;
    }
    catch (error) {
        electron_log_1.default.error('Failed to initialize database:', error);
        throw error;
    }
}
//get database instance
function getDatabase() {
    if (!db) {
        electron_log_1.default.error('Database not initialized. Call initializeDatabase() first.');
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}
//close the database connnection
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
        electron_log_1.default.info('Database connection closed.');
    }
}
//run database migrations
async function runMigrations(database) {
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
            electron_log_1.default.info(`Running migration: ${migration.name}`);
            database.transaction(() => {
                database.exec(migration.sql);
                database
                    .prepare('INSERT INTO migrations (name) VALUES (?)')
                    .run(migration.name);
            })();
            electron_log_1.default.info(`Migration completed: ${migration.name}`);
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
    ];
}
exports.default = {
    initialize: initializeDatabase,
    get: getDatabase,
    close: closeDatabase,
};
//# sourceMappingURL=connection.js.map