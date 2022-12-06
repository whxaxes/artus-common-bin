import { DefineCommand, Option, OptionProps } from 'artus-common-bin';

@DefineCommand({
  command: 'oneapi client [appName]',
  description: 'Run the oneapi client',
})
export class OneapiClientCommand {
  @Option()
  options: any;

  async run() {
    console.info('oneapi client', this.options.appName);
  }
}
