import '../../common';
import { Inject, ApplicationLifecycle, LifecycleHook, LifecycleHookUnit } from '@artus/core';
import { Program, ParsedCommands } from 'artus-common-bin';
import { interceptor } from './interceptor';

@LifecycleHookUnit()
export default class UsageLifecycle implements ApplicationLifecycle {
  @Inject()
  private readonly commands: ParsedCommands;

  @Inject()
  private readonly program: Program;

  @LifecycleHook()
  async configDidLoad() {
    const { commands } = this.commands;
    commands.forEach(command => {
      command.options = {
        ...command.options,

        help: {
          type: 'boolean',
          description: 'Show Help',
          alias: 'h',
        },
      };
    });

    this.program.use(interceptor);
  }
}
