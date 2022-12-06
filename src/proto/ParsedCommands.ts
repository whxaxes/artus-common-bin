import { Command, CommandMeta, OptionProps, EmptyCommand } from '../command';
import { MetadataEnum } from '../constant';
import parser from 'yargs-parser';
import { ArtusInjectEnum, Injectable, Container, Inject, ScopeEnum } from '@artus/core';

export interface MatchResult {
  matched?: ParsedCommand;
  fuzzyMatched?: ParsedCommand;
  args: Record<string, any>;
}

export interface ParsedCommandStruct {
  cmd: string;
  cmds: string[];
  isRoot: boolean;
  usage: string;
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

  let usage: string;
  let root = false;
  if (!splitCommand[0] || splitCommand[0].match(bregex)) {
    root = true;
    usage = [ binName, ...splitCommand ].join(' ');
  } else {
    usage = splitCommand.join(' ');
  }

  const parsedCommand: ParsedCommandStruct = {
    cmd: '',
    cmds: [ binName ],
    isRoot: root,
    usage,
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
  return parsedCommand;
}

export class ParsedCommand implements ParsedCommandStruct {
  cmd: string;
  cmds: string[];
  usage: string;
  alias: string[];
  demanded: Positional[];
  optional: Positional[];
  description: string;
  options: Record<string, OptionProps>;
  propKey: string;
  childs: ParsedCommand[];
  parent: ParsedCommand;

  constructor(public clz: typeof Command, opt: ParsedCommandStruct & CommandMeta) {
    this.usage = opt.usage;
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

@Injectable({ scope: ScopeEnum.EXECUTION })
export class ParsedCommands {
  #binName: string;
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
    const parsedCommands = commandList
      .map(clz => {
        const props: CommandMeta = Reflect.getMetadata(MetadataEnum.COMMAND, clz);
        const info = parseCommand(props.usage, this.#binName);
        const parsedCommand = new ParsedCommand(clz, { ...props, ...info });
        this.commands.set(info.cmds.join(' '), parsedCommand);
        return parsedCommand;
      });

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
            parent = cacheParsedCommand;
            return;
          }

          cacheParsedCommand.parent = parent;
          parent.childs.push(cacheParsedCommand);
          parent = cacheParsedCommand;
        });
      });
  }

  private checkDemanded(args: string[], pos: Positional[]) {
    const result: Record<string, any> = {};
    const pass = pos.every((positional, index) => {
      const r = positional.cmd.includes(String(args[index]));
      if (r) positional.cmd.forEach(c => result[c] = args[index]);
      return r;
    });
    return { result, pass };
  }

  private checkOptional(args: string[], pos: Positional[]) {
    const result: Record<string, any> = {};
    pos.forEach((positional, index) => {
      positional.cmd.forEach(c => result[c] = args[index]);
    });
    return { result };
  }

  private matchCommand(argv: string[]) {
    const result: MatchResult = {
      args: {},
    };

    let uid = '';
    let index = 0;
    const wholeArgv = [ this.#binName ].concat(argv);
    for (; index < wholeArgv.length; index++) {
      const el = wholeArgv[index];
      uid += uid ? ` ${el}` : el;

      const try_matched = this.commands.get(uid);
      if (try_matched) {
        result.fuzzyMatched = try_matched;
        continue;
      }

      break;
    }

    const extraArgs = wholeArgv.slice(index);
    if (result.fuzzyMatched) {
      const fuzzyMatched = result.fuzzyMatched;
      if (extraArgs.length) {
        if (fuzzyMatched.demanded.length) {
          const checkDemanded = this.checkDemanded(extraArgs, fuzzyMatched.demanded);
          if (!checkDemanded.pass) {
            // demanded not match
            return result;
          }

          Object.assign(result.args, checkDemanded.result);
        }

        if (fuzzyMatched.optional.length) {
          const info = this.checkOptional(extraArgs.slice(fuzzyMatched.demanded.length), fuzzyMatched.optional);
          Object.assign(result.args, info.result);
        }
      }

      result.matched = result.fuzzyMatched;
      return result;
    }

    return result;
  }

  getCommand(argv: string[]) {
    const result = this.matchCommand(argv);
    const parserOption: parser.Options = {};
    if (result.matched) {
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
    }

    Object.assign(result.args, parser(argv, parserOption));
    return result;
  }
}
