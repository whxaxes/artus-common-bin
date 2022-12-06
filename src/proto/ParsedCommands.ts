import { Command, CommandMeta, OptionProps, EmptyCommand } from '../command';
import { MetadataEnum } from '../constant';
import parser from 'yargs-parser';
import { ArtusInjectEnum, Injectable, Container, Inject, ScopeEnum } from '@artus/core';

export interface MatchResult {
  /**
   * total matched command
   */
  matched?: ParsedCommand;
  /**
   * fuzzy matched command
   */
  fuzzyMatched?: ParsedCommand;
  /**
   * parsed args by argv
   */
  args: Record<string, any>;
}

export interface ParsedCommandStruct {
  uid: string;
  cmd: string;
  cmds: string[];
  command: string;
  demanded: Positional[];
  optional: Positional[];
}

export interface Positional {
  cmd: string[];
  variadic: boolean;
}

export function parseCommand(cmd: string, binName: string) {
  const extraSpacesStrippedCommand = cmd.replace(/\s{2,}/g, ' ');
  const splitCommand = extraSpacesStrippedCommand.split(/\s+(?![^[]*]|[^<]*>)/);
  const bregex = /\.*[\][<>]/g;
  if (!splitCommand.length) throw new Error(`No command found in: ${cmd}`);

  // remove bin name
  if ([ binName, '$0' ].includes(splitCommand[0])) {
    splitCommand.shift();
  }

  let command: string;
  let root = false;
  if (!splitCommand[0] || splitCommand[0].match(bregex)) {
    root = true;
    command = [ binName, ...splitCommand ].join(' ');
  } else {
    command = splitCommand.join(' ');
  }

  const parsedCommand: ParsedCommandStruct = {
    uid: '',
    cmd: '',
    cmds: [ binName ],
    command,
    demanded: [],
    optional: [],
  };

  splitCommand.forEach((cmd, i) => {
    let variadic = false;
    cmd = cmd.replace(/\s/g, '');
    if (/\.+[\]>]/.test(cmd) && i === splitCommand.length - 1) variadic = true;

    const result = cmd.match(/^(\[|\<)/);
    if (result) {
      if (result[1] === '[') {
        parsedCommand.optional.push({
          cmd: cmd.replace(bregex, '').split('|'),
          variadic,
        });
      } else {
        parsedCommand.demanded.push({
          cmd: cmd.replace(bregex, '').split('|'),
          variadic,
        });
      }
    } else {
      parsedCommand.cmds.push(cmd);
    }
  });

  // last cmd is the command
  parsedCommand.cmd = parsedCommand.cmds[parsedCommand.cmds.length - 1];
  parsedCommand.uid = parsedCommand.cmds.join(' ');
  return parsedCommand;
}

export class ParsedCommand implements ParsedCommandStruct {
  uid: string;
  cmd: string;
  cmds: string[];
  command: string;
  alias: string[];
  demanded: Positional[];
  optional: Positional[];
  description: string;
  options: Record<string, OptionProps>;
  propKey: string;
  childs: ParsedCommand[];
  parent: ParsedCommand;

  constructor(public clz: typeof Command, opt: ParsedCommandStruct & CommandMeta) {
    this.uid = opt.uid;
    this.command = opt.command;
    this.cmd = opt.cmd;
    this.cmds = opt.cmds;
    this.demanded = opt.demanded;
    this.optional = opt.optional;
    const { key, meta } = Reflect.getMetadata(MetadataEnum.OPTION, clz) || {};
    this.options = meta;
    this.propKey = key;
    this.childs = [];
    this.parent = null;
    this.description = opt.description || '';
    this.alias = opt.alias
      ? Array.isArray(opt.alias)
        ? opt.alias
        : [ opt.alias ]
      : [];
  }

  get isRoot() {
    return !this.parent;
  }

  get isRunable() {
    return this.clz !== EmptyCommand;
  }

  get depth() {
    return this.cmds.length;
  }
}

@Injectable({ scope: ScopeEnum.SINGLETON })
export class ParsedCommands {
  #binName: string;

  root: ParsedCommand;
  commands: Map<string, ParsedCommand>;

  constructor(
    @Inject() container: Container,
    @Inject(ArtusInjectEnum.Config) config: any,
  ) {
    const commandList = container.getInjectableByTag(MetadataEnum.COMMAND);
    this.#binName = config.bin;
    this.buildCommandTree(commandList);
  }

  private buildCommandTree(commandList: Array<typeof Command>) {
    this.commands = new Map();
    const parsedCommandMap: Map<string, ParsedCommand> = new Map();
    const initCommandClz = clz => {
      const props: CommandMeta = Reflect.getMetadata(MetadataEnum.COMMAND, clz);

      let command = props.command;
      if (props.parent) {
        const parentParsedCommand = initCommandClz(props.parent);
        command = parentParsedCommand.cmds.concat(command).join(' ');
      }

      const info = parseCommand(command, this.#binName);
      if (parsedCommandMap.has(clz)) {
        return parsedCommandMap.get(clz);
      }

      const parsedCommand = new ParsedCommand(clz, { ...props, ...info });
      this.commands.set(info.uid, parsedCommand);
      parsedCommandMap.set(clz, parsedCommand);
      return parsedCommand;
    };

    const parsedCommands = commandList.map(initCommandClz);

    // handle parent and childs
    parsedCommands
      .sort((a, b) => a.depth - b.depth)
      .forEach(parsedCommand => {
        let parent: ParsedCommand | undefined;
        parsedCommand.cmds.forEach(cmd => {
          const fullCmd = parent ? parent.cmds.concat(cmd).join(' ') : cmd;

          let cacheParsedCommand = this.commands.get(fullCmd);
          if (!cacheParsedCommand) {
            // create empty node
            cacheParsedCommand = new ParsedCommand(EmptyCommand, parseCommand(fullCmd, this.#binName));
            this.commands.set(fullCmd, cacheParsedCommand);
          }

          if (!parent) {
            this.root = parent = cacheParsedCommand;
            return;
          }

          cacheParsedCommand.parent = parent;
          parent.childs.push(cacheParsedCommand);
          parent = cacheParsedCommand;
        });
      });
  }

  private checkPositional(args: string[], pos: Positional[]) {
    let nextIndex = pos.length;
    const result: Record<string, any> = {};
    const pass = pos.every((positional, index) => {
      const r = positional.variadic ? args.slice(index) : args[index];
      positional.cmd.forEach(c => result[c] = r);
      if (positional.variadic) nextIndex = args.length;
      return !!r;
    });
    return { result, pass, args: args.slice(nextIndex) };
  }

  private matchCommand(argv: string[]) {
    const result: MatchResult = {
      fuzzyMatched: this.root,
      args: parser(argv),
    };

    let index = 0;
    const wholeArgv = result.args._;
    for (; index < wholeArgv.length; index++) {
      const el = wholeArgv[index];
      const nextMatch = result.fuzzyMatched.childs.find(c => (
        c.cmd === el || c.alias.includes(el)
      ));

      if (nextMatch) {
        result.fuzzyMatched = nextMatch;
        continue;
      }

      break;
    }

    let extraArgs = wholeArgv.slice(index);
    if (result.fuzzyMatched) {
      const fuzzyMatched = result.fuzzyMatched;
      if (fuzzyMatched.demanded.length) {
        const checkDemanded = this.checkPositional(extraArgs, fuzzyMatched.demanded);
        if (!checkDemanded.pass) {
          // demanded not match
          return result;
        }

        Object.assign(result.args, checkDemanded.result);
        extraArgs = checkDemanded.args;
      }

      if (fuzzyMatched.optional.length) {
        const checkOptional = this.checkPositional(extraArgs, fuzzyMatched.optional);
        Object.assign(result.args, checkOptional.result);
        extraArgs = checkOptional.args;
      }

      // unknown args
      if (extraArgs.length) {
        return result;
      }

      result.matched = result.fuzzyMatched;
      return result;
    }

    return result;
  }

  getCommand(argv: string[]) {
    const result = this.matchCommand(argv);
    if (result.matched) {
      const parserOption: parser.Options = {};
      for (const key in result.matched.options) {
        const opt = result.matched.options[key];
        if (opt.alias !== undefined) {
          parserOption.alias = parserOption.alias || {};
          parserOption.alias[key] = opt.alias;
        }

        if (opt.type !== undefined) {
          parserOption[opt.type] = parserOption[opt.type] || [];
          parserOption[opt.type].push(key);
        }

        if (opt.default !== undefined) {
          parserOption.default = parserOption.default || {};
          parserOption.default[key] = opt.default;
        }
      }

      // parse again with parserOption
      Object.assign(result.args, parser(argv, parserOption));
    }

    return result;
  }
}
