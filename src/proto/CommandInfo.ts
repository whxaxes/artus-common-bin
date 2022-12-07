import { ArtusApplication, ArtusInjectEnum, Inject, Injectable, ScopeEnum } from '@artus/core';
import { ParsedCommands, MatchResult } from './ParsedCommands';

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

  /**
   * matched Command info
   */
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

  get args() {
    return this.matchResult.args;
  }

  get fuzzyMatched() {
    return this.matchResult.fuzzyMatched;
  }

  get matched() {
    return this.matchResult.matched;
  }

  parse() {
    this.matchResult = this.parsedCommands.matchCommand(this.raw);
  }
}
