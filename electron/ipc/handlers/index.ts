import log from 'electron-log';
import { registerPhotoHandlers } from './PhotoHandler';
import { registerSettingsHandlers } from './SettingsHandler';
import { registerFileHandlers } from './FileHandler';


export function registerIPCHandlers(): void {
  log.info('Registering IPC handlers...');

  registerPhotoHandlers();
  registerSettingsHandlers();
  registerFileHandlers();

  log.info('All IPC handlers registered successfully');
}
