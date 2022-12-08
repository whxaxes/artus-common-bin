import { Inject, ApplicationLifecycle, LifecycleHook, LifecycleHookUnit } from '@artus/core';
import { CommandTrigger } from './trigger';

@LifecycleHookUnit()
export default class Lifecycle implements ApplicationLifecycle {
  @Inject()
  private readonly trigger: CommandTrigger;

  @LifecycleHook()
  async didReady() {
    await this.trigger.start();
  }
}
