import { DefineCommand, DefineOption, Command } from '../../../../src/index';

interface DevOption {
  port?: number;
  inspect?: string;
}

@DefineCommand({
  command: 'dev [baseDir]',
  description: 'Run the development server',
  alias: [ 'd' ],
})
export class DevCommand extends Command {
  @DefineOption<DevOption>({
    port: {
      type: 'number',
      alias: 'p',
      default: 3000,
    },

    inspect: {
      type: 'boolean',
    },
  })
  options: DevOption;

  async run() {
    console.info(this.options);
  }
}
