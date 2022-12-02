import { DefineCommand } from '../../../../src/index';
import { DevCommand } from './dev';

@DefineCommand({
  command: 'debug [baseDir]',
  description: 'Run the development server at debug mode',
})
export class DebugCommand extends DevCommand {
  async run(args: string[]) {
    console.info('> args:', args);
  }
}
