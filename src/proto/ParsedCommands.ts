import { Command, CommandMeta, OptionProps } from '../command';
import { MetadataEnum } from '../constant';
import parser from 'yargs-parser';
import { ArtusInjectEnum, Injectable, Container, Inject, ScopeEnum } from '@artus/core';

export interface ParsedCommandStruct {
  cmd: string;
  root: boolean;
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

  let firstCommand: string;
  if (splitCommand[0] === binName) {
    splitCommand.shift();
  }

  let root = false;
  let usage = cmd;
  if (!splitCommand[0] || splitCommand[0].match(bregex)) {
    root = true;
    firstCommand = '';
  } else {
    usage = splitCommand.join(' ');
    firstCommand = splitCommand.shift();
  }

  const parsedCommand: ParsedCommandStruct = {
    cmd: firstCommand.replace(bregex, ''),
    root,
    usage,
    demanded: [],
    optional: [],
  };

  splitCommand.forEach((cmd, i) => {
    let variadic = false;
    cmd = cmd.replace(/\s/g, '');
    if (/\.+[\]>]/.test(cmd) && i === splitCommand.length - 1) variadic = true;
    if (/^\[/.test(cmd)) {
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
  });
  return parsedCommand;
}

export class ParsedCommand implements ParsedCommandStruct {
  cmd: string;
  usage: string;
  alias: string[];
  root: boolean;
  demanded: Positional[];
  optional: Positional[];
  description: string;
  options: Record<string, OptionProps>;
  propKey: string;
  depth: number;

  constructor(public clz: typeof Command, binName: string) {
    const props: CommandMeta = Reflect.getMetadata(MetadataEnum.COMMAND, clz);
    const parsedCommand = parseCommand(props.usage, binName);
    this.usage = parsedCommand.usage;
    this.root = parsedCommand.root;
    this.cmd = parsedCommand.cmd;
    this.demanded = parsedCommand.demanded;
    this.optional = parsedCommand.optional;
    this.depth = (this.root ? 0 : 1) + this.demanded.length + this.optional.length;
    const { key, meta } = Reflect.getMetadata(MetadataEnum.OPTION, clz) || {};
    this.options = meta;
    this.propKey = key;
    this.description = props.description || '';
    this.alias = props.alias
      ? Array.isArray(props.alias)
        ? props.alias
        : [ props.alias ]
      : [];
  }
}

@Injectable({ scope: ScopeEnum.EXECUTION })
export class ParsedCommands {
  #binName: string;
  commands: ParsedCommand[];

  constructor(
    @Inject() container: Container,
    @Inject(ArtusInjectEnum.Config) config: any,
  ) {
    const commandList = container.getInjectableByTag(MetadataEnum.COMMAND);
    this.#binName = config.bin;
    this.commands = commandList
      .map(clz => new ParsedCommand(clz, this.#binName))
      .sort((a, b) => b.depth - a.depth);
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

  private _getCommand(argv: string[]) {
    const argsObj: Record<string, any> = {};
    const binName = this.#binName;
    for (let command of this.commands) {
      let [ firstCmd, ...extraArgs ] = argv;
      if (command.root) extraArgs = argv;

      if (command.root || command.cmd === firstCmd || command.alias.includes(String(firstCmd))) {
        if (command.demanded.length) {
          const checkDemanded = this.checkDemanded(extraArgs, command.demanded);
          if (!checkDemanded.pass) continue;
          Object.assign(argsObj, checkDemanded.result);
        }

        if (command.optional.length) {
          const { result } = this.checkOptional(extraArgs.slice(command.demanded.length), command.optional);
          Object.assign(argsObj, result);
        }

        return { command, args: argsObj };
      }
    }

    return null;
  }

  getCommand(argv: string[]) {
    const result = this._getCommand(argv);
    if (!result) {
      return {
        command: undefined,
        args: parser(argv),
      };
    }

    const { command, args } = result;
    const parserOption: parser.Options = {};
    for (const key in command.options) {
      const opt = command.options[key];
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

    Object.assign(args, parser(argv, parserOption));
    return { command, args };
  }
}
