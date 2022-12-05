import { DefineCommand, Option, OptionProps } from 'artus-common-bin';

@DefineCommand({
  usage: 'oneapi server [appName]',
  description: 'Run the oneapi server',
})
export class OneapiServerCommand {
  @Option()
  options: any;

  async run() {
    console.info('oneapi server', this.options.appName);
  }
}
