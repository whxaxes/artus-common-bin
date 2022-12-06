import { DefineCommand, Option, Command } from 'artus-common-bin';
import { DevCommand as BaseDevCommand, DevOption as BaseDevOption } from 'my-bin';

export interface DevOption extends BaseDevOption {
  other?: string;
}

@DefineCommand()
export class DevCommand extends BaseDevCommand {
  @Option<DevOption>({
    other: {
      type: 'string',
      alias: 'o',
    },
  })
  options: DevOption;

  async run() {
    super.run();
    console.info('other', this.options.other);
  }
}
