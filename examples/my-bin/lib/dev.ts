import { DefineCommand, Option, Command } from 'artus-common-bin';

export interface DevOption {
  port?: number;
  inspect?: string;
  nodeFlags?: string;
  baseDir?: string;
}

@DefineCommand({
  usage: 'my-bin dev [baseDir]',
  description: 'Run the development server',
  alias: [ 'd' ],
})
export class DevCommand extends Command {
  @Option<DevOption>({
    port: {
      type: 'number',
      alias: 'p',
      default: 3000,
      description: 'Start A Server',
    },

    inspect: {
      type: 'boolean',
      default: false,
      description: 'Debug with node-inspector',
    },

    nodeFlags: {
      type: 'string',
    },
  })
  options: DevOption;

  async run() {
    console.info('port', this.options.port);
    console.info('inspect', this.options.inspect);
    console.info('nodeFlags', this.options.nodeFlags);
    console.info('baseDir', this.options.baseDir);
  }
}
