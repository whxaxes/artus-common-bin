import '../common';
import { Inject, ApplicationLifecycle, LifecycleHook, LifecycleHookUnit } from '@artus/core';
import { Context } from '@artus/pipeline';
import { CommandTrigger, CommandInfo, ParsedCommands, ParsedCommand } from 'artus-common-bin';
import commandLineUsage from 'command-line-usage';

@LifecycleHookUnit()
export default class UsageLifecycle implements ApplicationLifecycle {
  @Inject()
  private readonly trigger: CommandTrigger;

  @LifecycleHook()
  async configDidLoad() {
    const displayCommandUsage = (command: ParsedCommand) => {
      const demanded = command.demanded ? command.demanded.map(d => `<${d.cmd.join('|')}>`).join(' ') : '';
      const optional = command.optional ? command.optional.map(d => `[${d.cmd.join('|')}]`).join(' ') : '';
      const baseUsage = [ command.cmd, demanded, optional ].filter(c => !!c).join(' ');
      const optionKeys = command.options ? Object.keys(command.options) : [];
      return {
        optionKeys,
        text: `${baseUsage}${optionKeys.length ? ' [options]' : ''}`,
      };
    };

    const defaultOptions = [{
      name: 'help',
      type: Boolean,
      description: 'show help',
      alias: 'h',
    }] as any;

    this.trigger.use(async (ctx: Context, next) => {
      const cmdInfo = ctx.container.get(CommandInfo);
      if (cmdInfo.args?.help || cmdInfo.args?.h) {
        const displayTexts = [];
        const command = cmdInfo.command;

        if (command) {
          const { optionKeys, text } = displayCommandUsage(command);

          displayTexts.push(`Usage: ${cmdInfo.bin} ${text}`);
          displayTexts.push(commandLineUsage([
            {
              header: 'Options',
              optionList: optionKeys
                .map(flag => {
                  const option = command.options[flag];
                  const showFlag = flag[0].toLowerCase() + flag.substring(1).replace(/[A-Z]/g, '-$&').toLowerCase();
                  return {
                    name: showFlag,
                    type: { name: option.type },
                    description: option.description,
                    alias: option.alias,
                    defaultValue: option.default,
                  };
                })
                .concat(defaultOptions),
            },
          ]));
        } else {
          displayTexts.push(`Usage: ${cmdInfo.bin} <command> [options]`);
          displayTexts.push(commandLineUsage([
            {
              header: 'Available Commands',
              content: Array.from(new Set(cmdInfo.commands.values())).map(command => {
                const { text } = displayCommandUsage(command);
                return {
                  name: text,
                  summary: command.description,
                };
              }),
            },
            {
              header: 'Options',
              optionList: defaultOptions,
            },
          ]));
        }

        return console.info(displayTexts.join('\n'));
      }

      await next();
    });
  }
}
