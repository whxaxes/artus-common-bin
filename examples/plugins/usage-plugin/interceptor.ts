import { Context } from '@artus/pipeline';
import commandLineUsage from 'command-line-usage';
import { CommandInfo } from 'artus-common-bin';

export async function interceptor(ctx: Context, next) {
  const cmdInfo = ctx.container.get(CommandInfo);
  const { fuzzyMatched, matched, args } = cmdInfo.matchResult;
  if (!fuzzyMatched || !args.help) {
    if (!matched) {
      // can not match any command
      console.error(`\n Command not found: '${cmdInfo.bin} ${cmdInfo.raw.join(' ')}', try '${fuzzyMatched?.cmds.join(' ') || cmdInfo.bin} --help' for more information.\n`);
      process.exit(1);
    }

    return await next();
  }

  // display help informations
  const displayTexts = [];
  const commandLineUsageList = [];
  const optionKeys = fuzzyMatched.options ? Object.keys(fuzzyMatched.options) : [];

  // usage info in first line
  displayTexts.push(`Usage: ${fuzzyMatched.command.startsWith(cmdInfo.bin) ? '' : `${cmdInfo.bin} `}${fuzzyMatched.command}`);
  if (fuzzyMatched.description) {
    displayTexts.push('', fuzzyMatched.description);
  }

  // available commands, display all subcommands if match the root command
  const availableCommands = (
    fuzzyMatched.isRoot
      ? Array.from(new Set(cmdInfo.commands.values()))
      : [ fuzzyMatched ].concat(fuzzyMatched.childs || [])
  ).filter(c => !c.isRoot && c.isRunable);

  if (availableCommands.length) {
    commandLineUsageList.push({
      header: 'Available Commands',
      content: availableCommands.map(command => ({
        name: command.command,
        summary: command.description,
      })),
    });
  }

  // options list, like -h, --help / -v, --version ...
  commandLineUsageList.push({
    header: 'Options',
    optionList: optionKeys
      .map(flag => {
        const option = fuzzyMatched.options[flag];
        const showFlag = flag[0].toLowerCase() + flag.substring(1).replace(/[A-Z]/g, '-$&').toLowerCase();
        return {
          name: showFlag,
          type: { name: option.type },
          description: option.description,
          alias: option.alias,
          defaultValue: option.default,
        };
      }),
  });

  // use command-line-usage to format help informations.
  displayTexts.push(commandLineUsage(commandLineUsageList));
  console.info(displayTexts.join('\n'));
}
