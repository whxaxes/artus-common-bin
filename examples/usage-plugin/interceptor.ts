import { Context } from '@artus/pipeline';
import commandLineUsage from 'command-line-usage';
import { CommandInfo } from 'artus-common-bin';

export async function interceptor(ctx: Context, next) {
  const cmdInfo = ctx.container.get(CommandInfo);
  const { fuzzyMatched: matched, args } = cmdInfo.matchResult;
  if (!matched || !args.help) {
    return await next();
  }

  const displayTexts = [];
  const optionKeys = matched.options ? Object.keys(matched.options) : [];
  const optionList = optionKeys
    .map(flag => {
      const option = matched.options[flag];
      const showFlag = flag[0].toLowerCase() + flag.substring(1).replace(/[A-Z]/g, '-$&').toLowerCase();
      return {
        name: showFlag,
        type: { name: option.type },
        description: option.description,
        alias: option.alias,
        defaultValue: option.default,
      };
    });

  displayTexts.push(`Usage: ${matched.command.startsWith(cmdInfo.bin) ? '' : `${cmdInfo.bin} `}${matched.command}`);
  if (matched.description) {
    displayTexts.push('', matched.description);
  }

  const commandLineUsageList = [];
  if (matched.childs.length) {
    const childCommands = matched.isRoot ? Array.from(new Set(cmdInfo.commands.values())) : matched.childs;
    commandLineUsageList.push({
      header: 'Available Commands',
      content: childCommands
        .filter(c => !c.isRoot && c.isRunable)
        .map(command => ({
          name: command.command,
          summary: command.description,
        })),
    });
  }

  commandLineUsageList.push({
    header: 'Options',
    optionList,
  });

  displayTexts.push(commandLineUsage(commandLineUsageList));
  console.info(displayTexts.join('\n'));
}
