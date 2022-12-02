import { Inject, ApplicationLifecycle, LifecycleHook, LifecycleHookUnit, Container, ArtusInjectEnum, ArtusApplication } from '@artus/core';
import { CommandTrigger } from './trigger';

@LifecycleHookUnit()
export default class Lifecycle implements ApplicationLifecycle {
  @Inject(ArtusInjectEnum.Application)
  private readonly application: ArtusApplication;

  @Inject()
  private readonly trigger: CommandTrigger;

  @LifecycleHook()
  async willReady() {
    await this.trigger.init();
  }

  @LifecycleHook()
  async didReady() {
    await this.trigger.run();
  }
}
