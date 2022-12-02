import { DefineCommand, Option, OptionProps } from '../../../../src/index';

@DefineCommand({
  command: 'oneapi client [appName]',
  description: 'Run the oneapi client',
})
export class OneapiClientCommand {
  async run(args: string[]) {
    console.info('> args:', args);
  }
}
