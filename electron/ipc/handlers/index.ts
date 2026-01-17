import log from 'electron-log';
import { registerPhotoHandlers } from './PhotoHandler';
import { registerSettingsHandlers } from './SettingsHandler';
import { registerFileHandlers } from './FileHandler';
import { registerTemplateHandler } from './TemplateHandler';
import { registerEmailHandler } from './EmailHandler';


export function registerIPCHandlers(): void {
  log.info('Registering IPC handlers...');

  registerPhotoHandlers();
  registerSettingsHandlers();
  registerFileHandlers();
  registerTemplateHandler();
  registerEmailHandler();

  log.info('All IPC handlers registered successfully');
}
