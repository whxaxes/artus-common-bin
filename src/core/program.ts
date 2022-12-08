/**
 * api wrapper for trigger
 **/

import { Inject, Injectable, ScopeEnum } from '@artus/core';
import { MiddlewareInput } from '@artus/pipeline';
import { CommandTrigger } from './trigger';

@Injectable({ scope: ScopeEnum.SINGLETON })
export class Program {
  @Inject()
  trigger: CommandTrigger;

  use(fn: MiddlewareInput) {
    this.trigger.use(fn);
  }
}
