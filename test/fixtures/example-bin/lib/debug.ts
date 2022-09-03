import { Command, CommandOption, DefineOption, Flag,  } from '../../../../src/index';
import { DevCommand, ExecArgvOption } from './dev';

@DefineOption()
export class DebugOption extends ExecArgvOption {
  @Flag({
    description: 'inject devtool',
    default: true,
  })
  debug: boolean;
}

@Command({
  command: 'debug [baseDir]',
  description: 'Run the development server at debug mode',
})
export class DebugCommand extends DevCommand {
  @CommandOption()
  execArgv: DebugOption;

  async run(args: string[]) {
    console.info('> args:', args);
    console.info('> worker:', this.argv.worker);
    console.info('> debug:', this.execArgv.debug);
    console.info('>', this.argv);
  }
}
