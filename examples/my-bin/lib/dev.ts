import { DefineCommand, Option, Command } from '../../../src/index';

export interface DevOption {
  port?: number;
  inspect?: string;
  nodeFlags?: string;
}

@DefineCommand({
  command: 'dev [baseDir]',
  description: 'Run the development server',
  alias: [ 'd' ],
})
export class DevCommand extends Command {
  @Option<DevOption>({
    port: {
      type: 'number',
      alias: 'p',
      default: 3000,
    },

    inspect: {
      type: 'boolean',
    },

    nodeFlags: {
      type: 'string',
    },
  })
  options: DevOption;

  async run() {
    console.info(this.options.port);
    console.info(this.options.inspect);
    console.info(this.options.nodeFlags);
  }
}
