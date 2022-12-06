import '../common';
import { Inject, ApplicationLifecycle, LifecycleHook, LifecycleHookUnit } from '@artus/core';
import { CommandTrigger, ParsedCommands } from 'artus-common-bin';
import { interceptor } from './interceptor';

@LifecycleHookUnit()
export default class UsageLifecycle implements ApplicationLifecycle {
  @Inject()
  private readonly commands: ParsedCommands;

  @Inject()
  private readonly trigger: CommandTrigger;

  @LifecycleHook()
  async configDidLoad() {
    const { root } = this.commands;
    if (!root.options?.version) {
      root.options = {
        ...root.options,

        version: {
          type: 'boolean',
          alias: 'v',
          description: 'Show Version',
        },
      };

      this.trigger.use(interceptor);
    }
  }
}
