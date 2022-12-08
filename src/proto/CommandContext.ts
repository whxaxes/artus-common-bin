import { ArtusApplication, ArtusInjectEnum, Inject, Injectable, ScopeEnum } from '@artus/core';
import { ParsedCommands, MatchResult } from './ParsedCommands';

export interface CommandInput {
  argv: string[];
  env: Record<string, string>;
  cwd: string;
}

/**
 * Command Context, store `argv`/`env`/`cwd`/`match result` ...
 */
@Injectable({ scope: ScopeEnum.EXECUTION })
export class CommandContext<T extends Record<string, any> = Record<string, any>> {
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

  get rootCommand() {
    return this.parsedCommands.root;
  }

  get args() {
    return this.matchResult.args as T;
  }

  get fuzzyMatched() {
    return this.matchResult.fuzzyMatched;
  }

  get matched() {
    return this.matchResult.matched;
  }

  get error() {
    return this.matchResult.error;
  }

  private parse() {
    this.matchResult = this.parsedCommands.matchCommand(this.raw);
  }
}
