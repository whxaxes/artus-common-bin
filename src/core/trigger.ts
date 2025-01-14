import { Trigger, Injectable, ScopeEnum } from '@artus/core';
import { Context, Output } from '@artus/pipeline';
import Debug from 'debug';
import { EXCUTION_SYMBOL } from '../constant';
import { CommandContext, CommandInput } from '../proto/CommandContext';
const debug = Debug('artus-common-bin#trigger');

@Injectable({ scope: ScopeEnum.SINGLETON })
export class CommandTrigger extends Trigger {
  async start() {
    // core middleware
    this.use(async (ctx: Context, next) => {
      await next();

      const { matched, error } = ctx.container.get(CommandContext);

      // match error, throw
      if (error) throw error;
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

    await this.execute();
  }

  async init() {
    this.use(async (ctx: CommandContext, next) => {
      // parse argv and match command
      await ctx.init();
      await next();
    });
  }

  /** override artus context */
  async initContext(input?: CommandInput, output?: Output): Promise<Context> {
    const baseCtx = await super.initContext(input, output);
    const cmdCtx = baseCtx.container.get(CommandContext);
    cmdCtx.container = baseCtx.container;
    cmdCtx.container.set({ id: CommandContext, value: cmdCtx });
    cmdCtx.input = baseCtx.input as CommandInput;
    cmdCtx.output = baseCtx.output;
    return cmdCtx;
  }

  /** start a pipeline and execute */
  async execute(input?: Partial<CommandInput['params']>) {
    try {
      const ctx = await this.initContext({
        params: {
          // set input data
          argv: process.argv.slice(2),
          env: { ...process.env },
          cwd: process.cwd(),
          ...input,
        },
      });

      ctx.container.set({ id: Context, value: ctx });

      await this.startPipeline(ctx);
    } catch (err) {
      console.error(err);
    }
  }
}
