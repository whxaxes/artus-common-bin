import { DefineCommand, Command } from 'artus-common-bin';

@DefineCommand({
  command: 'module',
  description: 'Module Commands',
})
export class ModuleMainCommand extends Command {
  async run() {
    console.info('module is run');
  }
}
