import { Trigger, Injectable, ScopeEnum } from '@artus/core';
import { Context } from '@artus/pipeline';
import Debug from 'debug';
import { EXCUTION_SYMBOL } from './decorator';
import { CommandContext, CommandInput } from './proto/CommandInfo';
const debug = Debug('artus-common-bin#trigger');

@Injectable({ scope: ScopeEnum.SINGLETON })
export class CommandTrigger extends Trigger {
  async start() {
    // core middleware
    this.use(async (ctx: Context, next) => {
      await next();

      const { matched } = ctx.container.get(CommandContext);
      if (!matched) {
        debug('Can not match any command, exit...');
        return;
      }

      const commandInstance = ctx.container.get(matched.clz);
      debug('Run command %s', matched.clz.name);

      // execute command
      const result = await commandInstance[EXCUTION_SYMBOL]();
      ctx.output.data = { result };
    });

    try {
      const ctx = await this.initContext();
      ctx.container.set({ id: Context, value: ctx });

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
      const cmdCtx = ctx.container.get(CommandContext);
      cmdCtx.init(ctx.input.params as CommandInput);
      await next();
    });
  }
}
