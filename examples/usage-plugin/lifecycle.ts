import '../common';
import { Inject, ApplicationLifecycle, LifecycleHook, LifecycleHookUnit } from '@artus/core';
import { CommandTrigger } from 'artus-common-bin';
import { interceptor } from './interceptor';

@LifecycleHookUnit()
export default class UsageLifecycle implements ApplicationLifecycle {
  @Inject()
  private readonly trigger: CommandTrigger;

  @LifecycleHook()
  async configDidLoad() {
    this.trigger.use(interceptor);
  }
}
