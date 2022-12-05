import { DefineCommand, Option, OptionProps } from 'artus-common-bin';

@DefineCommand({
  usage: 'oneapi server [appName]',
  description: 'Run the oneapi server',
})
export class OneapiServerCommand {
  async run(args: string[]) {
    console.info('> args:', args);
  }
}
