import { Inject, Injectable, ScopeEnum } from '@artus/core';
import { Context } from '@artus/pipeline';
import { ParsedCommands } from '../proto/ParsedCommands';
import { Command } from '../proto/Command';
import { CommandTrigger } from './trigger';
import { EXCUTION_SYMBOL } from '../constant';
import assert from 'node:assert';
import { format } from 'node:util';

@Injectable({ scope: ScopeEnum.EXECUTION })
export class Helper {
  @Inject()
  private readonly ctx: Context;

  @Inject()
  private readonly trigger: CommandTrigger;

  @Inject()
  private readonly commands: ParsedCommands;

  /** executing other command in same pipeline */
  async forward<T extends Record<string, any> = Record<string, any>>(clz: typeof Command, extraArgs?: T) {
    const cmd = this.commands.getCommand(clz);
    assert(cmd, format('Can not forward to command %s', clz.name));
    const instance = this.ctx.container.get(cmd.clz);
    if (extraArgs) instance[cmd.optionsKey] = Object.assign(instance[cmd.optionsKey], extraArgs);
    return instance[EXCUTION_SYMBOL]();
  }

  /** create new pipeline to execute */
  async redirect(argv: string[]) {
    await this.trigger.execute({ argv });
  }
}