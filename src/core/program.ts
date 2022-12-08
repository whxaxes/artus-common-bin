/**
 * open api for user
 **/

import { Inject, Injectable, ScopeEnum } from '@artus/core';
import { MiddlewareInput } from '@artus/pipeline';
import { CommandTrigger } from './trigger';
import { OptionProps } from '../types';
import { Command } from '../proto/Command';
import { Middleware, MiddlewareDecoratorOption } from './decorators';
import { ParsedCommand, ParsedCommands } from '../proto/ParsedCommands';

@Injectable({ scope: ScopeEnum.SINGLETON })
export class Program {
  @Inject()
  private readonly trigger: CommandTrigger;

  @Inject()
  private readonly parsedCommands: ParsedCommands;

  /** all commands map */
  get commands() {
    return this.parsedCommands.commands;
  }

  /** root of command tree */
  get rootCommand() {
    return this.parsedCommands.root;
  }

  /** add options, works in all command by default */
  option(opt: Record<string, OptionProps>, effectCommands?: ParsedCommand[]) {
    effectCommands = effectCommands || Array.from(this.commands.values());
    effectCommands.forEach(c => c.updateGlobalOptions(opt));
  }

  /** register pipeline middleware */
  use(fn: MiddlewareInput) {
    return this.trigger.use(fn);
  }

  /** register middleware in command */
  useInCommand(clz: (typeof Command) | ParsedCommand, fn: MiddlewareInput, opt?: MiddlewareDecoratorOption) {
    const cmd = clz instanceof ParsedCommand ? clz : this.parsedCommands.getCommand(clz);
    Middleware(fn, opt)(cmd.clz);
  }

  /** register middleware in command.run */
  useInExecution(clz: (typeof Command) | ParsedCommand, fn: MiddlewareInput, opt?: MiddlewareDecoratorOption) {
    const cmd = clz instanceof ParsedCommand ? clz : this.parsedCommands.getCommand(clz);
    Middleware(fn, opt)(cmd.clz, 'run');
  }
}
