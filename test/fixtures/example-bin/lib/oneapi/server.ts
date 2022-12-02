import { DefineCommand, DefineOption, OptionProps } from '../../../../../src/index';

@DefineCommand({
  command: 'oneapi server [appName]',
  description: 'Run the oneapi server',
})
export class OneapiServerCommand {
  async run(args: string[]) {
    console.info('> args:', args);
  }
}
