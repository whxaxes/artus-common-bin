import '../../common';
import { Inject, ApplicationLifecycle, LifecycleHook, LifecycleHookUnit } from '@artus/core';
import { Program, Context, CommandContext, Helper } from 'artus-common-bin';

@LifecycleHookUnit()
export default class UsageLifecycle implements ApplicationLifecycle {
  @Inject()
  private readonly program: Program;

  @LifecycleHook()
  async configDidLoad() {
    this.program.commands.forEach(command => (
      command.updateOptions({
        help: {
          type: 'boolean',
          description: 'Show Help',
          alias: 'h',
        },
      })
    ));

    this.program.use(async function interceptor(ctx: Context, next) {
      const { fuzzyMatched, matched, args, bin, raw } = ctx.container.get(CommandContext);
      if (!fuzzyMatched || !args.help) {
        if (!matched) {
          // can not match any command
          console.error(`\n Command not found: '${bin} ${raw.join(' ')}', try '${fuzzyMatched?.cmds.join(' ') || bin} --help' for more information.\n`);
          process.exit(1);
        }

        return await next();
      }

      // redirect to help command
      const helper = ctx.container.get(Helper);
      await helper.redirect([ 'help', `"${fuzzyMatched.uid}"` ]);
    });
  }
}
