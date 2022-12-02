import { DefineCommand, Option } from '../../../src/index';
import { DevCommand, DevOption } from './dev';

interface DebugOption extends DevOption {
  flags?: string;
}

@DefineCommand({
  command: 'debug [baseDir]',
  description: 'Run the development server at debug mode',
})
export class DebugCommand extends DevCommand {
  @Option<DebugOption>({
    flags: {
      type: 'string',
      alias: 'f',
    },
  })
  args: DebugOption;

  async run() {
    console.info('> args:', this.args);
  }
}
