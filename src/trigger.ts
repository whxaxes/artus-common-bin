import { Trigger, Injectable, ScopeEnum, Inject, Container } from '@artus/core';
import { Context } from '@artus/pipeline';
import { Argv } from './proto/Argv';
import { ParsedCommands, ParsedCommand } from './proto/ParsedCommands';

export { Middleware } from '@artus/pipeline';

export enum HookEventEnum {
  INIT = 'init',
  PRERUN = 'prerun',
  POSTRUN = 'postrun',
  ERROR = 'error',
  END = 'end',
}

export type HookFunction = (opts?: Record<string, any>) => Promise<void>;

export interface CommandInput {
  commandClz: any;
  argv: Record<string, any>;
  env: Record<string, string>;
  cwd: string;
}

@Injectable({ scope: ScopeEnum.SINGLETON })
export class CommandTrigger extends Trigger {
  @Inject()
  container: Container;

  async run() {
    try {
      const ctx = await this.initContext();
      const argv = ctx.container.get(Argv);
      argv.init({
        argv: process.argv.slice(2),
        env: { ...process.env },
        cwd: process.cwd(),
      });

      await this.startPipeline(ctx);
    } catch (err) {
      console.error(err);
    }
  }

  async init() {
    this.use(async (ctx: Context, next) => {
      await next();

      const parsedArgv = ctx.container.get(Argv);
      const parsedCommands = this.container.get(ParsedCommands);
      const result = parsedCommands.getCommand(parsedArgv.raw);
      if (!result) return;

      const commandInstance = ctx.container.get(result.command.clz);
      Object.defineProperty(commandInstance, result.command.options.key, { value: result.args });
      ctx.output.data = {
        args: result.args,
        result: await commandInstance.run(),
      };
    });
  }
}
