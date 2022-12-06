import { DefineCommand, DefineOption, OptionProps } from 'artus-common-bin';

@DefineCommand({
  command: 'oneapi server [appName]',
  description: 'Run the oneapi server',
})
export class OneapiServerCommand {
  @DefineOption()
  options: any;

  async run() {
    console.info('oneapi server', this.options.appName);
  }
}
