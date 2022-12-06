import { DefineCommand, Option, Command } from 'artus-common-bin';
import { DevCommand as BaseDevCommand, DevOption as BaseDevOption } from 'examples/egg-bin';

export interface DevOption extends BaseDevOption {
  other?: string;
  daemon?: boolean;
}

@DefineCommand({
  description: 'Run the development server with chair-bin',
})
export class ChairDevCommand extends BaseDevCommand {
  @Option<DevOption>({
    other: {
      type: 'string',
      alias: 'o',
    },

    daemon: {
      type: 'boolean',
      default: false,
    },
  })
  options: DevOption;

  async run() {
    super.run();
    console.info('other', this.options.other);
    console.info('daemon', this.options.daemon);
  }
}
