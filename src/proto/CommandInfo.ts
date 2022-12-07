import { ArtusApplication, ArtusInjectEnum, Inject, Injectable, ScopeEnum } from '@artus/core';
import { ParsedCommands, MatchResult } from './ParsedCommands';

export interface CommandInput {
  argv: string[];
  env: Record<string, string>;
  cwd: string;
}

/**
 * Command Context
 */
@Injectable({ scope: ScopeEnum.EXECUTION })
export class CommandContext {
  #raw: string[];

  @Inject(ArtusInjectEnum.Application)
  private readonly app: ArtusApplication;

  @Inject()
  private readonly parsedCommands: ParsedCommands;

  /** matched result */
  private matchResult: MatchResult;

  bin: string;
  env: Record<string, string>;
  cwd: string;

  init(options: CommandInput) {
    this.bin = this.app.config.bin;
    this.env = options.env;
    this.cwd = options.cwd;
    this.raw = options.argv;
    return this;
  }

  /**
   * same as argv in process.argv
   * using `raw` instead of `argv` to avoid feeling confusing between `argv` and `args`
   */
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
