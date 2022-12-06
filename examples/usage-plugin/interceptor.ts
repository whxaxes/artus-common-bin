import { Context } from '@artus/pipeline';
import commandLineUsage from 'command-line-usage';
import { ParsedCommand, CommandInfo, ParsedCommands } from 'artus-common-bin';

const defaultOptions = [{
  name: 'help',
  type: Boolean,
  description: 'Show Help',
  alias: 'h',
}] as any;

export async function interceptor(ctx: Context, next) {
  const cmdInfo = ctx.container.get(CommandInfo);
  if (cmdInfo.args?.help || cmdInfo.args?.h) {
    const displayTexts = [];
    const command = cmdInfo.command;

    if (command && !command.root) {
      const optionKeys = command.options ? Object.keys(command.options) : [];

      displayTexts.push(`Usage: ${cmdInfo.bin} ${cmdInfo.command.usage}`);
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
      displayTexts.push(`Usage: ${cmdInfo.command.usage}`);
      displayTexts.push(commandLineUsage([
        {
          header: 'Available Commands',
          content: Array.from(new Set(cmdInfo.commands.values())).map(command => {
            return {
              name: command.usage,
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
}
