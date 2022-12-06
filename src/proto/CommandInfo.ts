import { ArtusApplication, ArtusInjectEnum, Inject, Injectable, ScopeEnum } from '@artus/core';
import { ParsedCommand, ParsedCommands, MatchResult } from './ParsedCommands';

export interface CommandInput {
  argv: string[];
  env: Record<string, string>;
  cwd: string;
}

export interface CommandBaseArgs {
  _: string[];
}

@Injectable({ scope: ScopeEnum.EXECUTION })
export class CommandInfo<T extends Record<string, any> = Record<string, any>> {
  #raw: string[];

  @Inject(ArtusInjectEnum.Application)
  private readonly app: ArtusApplication;

  @Inject()
  private readonly parsedCommands: ParsedCommands;

  bin: string;
  env: Record<string, string>;
  cwd: string;
  args: T & CommandBaseArgs;
  matchResult: MatchResult;

  init(options: CommandInput) {
    this.bin = this.app.config.bin;
    this.env = options.env;
    this.cwd = options.cwd;
    this.raw = options.argv;
    return this;
  }

  get raw() {
    return this.#raw;
  }

  set raw(val: string[]) {
    this.#raw = val;
    this.parse();
  }

  get commands() {
    return this.parsedCommands.commands;
  }

  parse() {
    this.matchResult = this.parsedCommands.getCommand(this.raw);
  }
}
