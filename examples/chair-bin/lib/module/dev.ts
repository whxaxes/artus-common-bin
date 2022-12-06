import { DefineCommand, Command } from 'artus-common-bin';
import { ModuleMainCommand } from './main';
import { DevCommand } from '../dev';

@DefineCommand({
  description: 'Module Dev Commands',
  parent: ModuleMainCommand,
})
export class ModuleDevCommand extends DevCommand {
  async run() {
    console.info('module is dev in', this.options.baseDir);
  }
}
