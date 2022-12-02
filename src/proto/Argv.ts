import { Injectable, ScopeEnum } from '@artus/core';

@Injectable({ scope: ScopeEnum.EXECUTION })
export class Argv {
  raw: string[];
  env: Record<string, string>;
  cwd: string;

  init(options: {
    argv: string[];
    env: Record<string, string>;
    cwd: string;
  }) {
    this.raw = options.argv;
    this.env = options.env;
    this.cwd = options.cwd;
  }
}
