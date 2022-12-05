import { DefineCommand, Option, Command } from 'artus-common-bin';

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
      description: 'Start A Server',
    },

    inspect: {
      type: 'boolean',
      description: 'Debug with node-inspector',
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
