import { Trigger, Injectable, ScopeEnum, Inject, Container } from '@artus/core';
import { Context } from '@artus/pipeline';
import { CommandInfo, CommandInput } from './proto/CommandInfo';

@Injectable({ scope: ScopeEnum.SINGLETON })
export class CommandTrigger extends Trigger {
  @Inject()
  container: Container;

  async start() {
    // core middleware
    this.use(async (ctx: Context, next) => {
      await next();

      const cmdInfo = ctx.container.get(CommandInfo);
      const { matched, args } = cmdInfo.matchResult;
      if (!matched) return;

      const commandInstance = ctx.container.get(matched.clz);
      Object.defineProperty(commandInstance, matched.propKey, { value: args });

      // trigger command
      const result = await commandInstance.run();
      ctx.output.data = { result };
    });

    try {
      const ctx = await this.initContext();

      // set input data
      ctx.input.params = {
        argv: process.argv.slice(2),
        env: { ...process.env },
        cwd: process.cwd(),
      } satisfies CommandInput;

      await this.startPipeline(ctx);
    } catch (err) {
      console.error(err);
    }
  }

  async init() {
    this.use(async (ctx: Context, next) => {
      // init command info
      const commandInfo = ctx.container.get(CommandInfo);
      commandInfo.init(ctx.input.params as any);
      await next();
    });
  }
}
