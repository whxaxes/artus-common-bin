import { DefineCommand, Option, OptionProps } from 'artus-common-bin';

@DefineCommand({
  usage: 'oneapi client [appName]',
  description: 'Run the oneapi client',
})
export class OneapiClientCommand {
  @Option()
  options: any;

  async run() {
    console.info('oneapi client', this.options.appName);
  }
}
