import { DefineCommand } from 'artus-common-bin';
import { DevCommand as BaseDevCommand, DevOption as BaseDevOption } from 'examples/egg-bin';

@DefineCommand({
  command: 'module',
  description: 'Module Commands',
})
export class ModuleMainCommand extends BaseDevCommand {
  async run() {
    console.info('module is run');
  }
}
