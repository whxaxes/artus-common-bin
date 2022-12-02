import { parseCommand, ParsedCommand as ParsedCommandStruct, Positional } from '../util/parse-command';
import { Command, OptionMeta, CommandProps } from '../command';
import { MetadataEnum } from '../constant';
import parser from 'yargs-parser';
import { Injectable, Container, Inject, ScopeEnum } from '@artus/core';

export class ParsedCommand implements ParsedCommandStruct {
  cmd: string;
  alias: string[];
  demanded: Positional[];
  optional: Positional[];
  description: string;
  options: OptionMeta;

  constructor(public clz: typeof Command) {
    const props: CommandProps = Reflect.getMetadata(MetadataEnum.COMMAND, clz);
    const parsedCommand = parseCommand(props.command);
    this.cmd = parsedCommand.cmd;
    this.options = Reflect.getMetadata(MetadataEnum.OPTION, clz) || {};
    this.demanded = parsedCommand.demanded;
    this.optional = parsedCommand.optional;
    this.description = props.description || '';
    this.alias = props.alias
      ? Array.isArray(props.alias)
        ? props.alias
        : [ props.alias ]
      : [];
  }
}

@Injectable({ scope: ScopeEnum.SINGLETON })
export class ParsedCommands {
  commands: ParsedCommand[];

  constructor(@Inject() container: Container) {
    const commandList = container.getInjectableByTag(MetadataEnum.COMMAND);
    this.commands = commandList.map(clz => new ParsedCommand(clz));
  }

  private checkDemanded(args: string[], pos: Positional[]) {
    const result: Record<string, string> = {};
    const pass = pos.every((positional, index) => {
      const r = positional.cmd.includes(String(args[index]));
      if (r) positional.cmd.forEach(c => result[c] = args[index]);
      return r;
    });
    return { result, pass };
  }

  private checkOptional(args: string[], pos: Positional[]) {
    const result: Record<string, string> = {};
    pos.forEach((positional, index) => {
      positional.cmd.forEach(c => result[c] = args[index]);
    });
    return { result };
  }

  private _getCommand(argv: string[]) {
    const argsObj: Record<string, string> = {};
    for (let command of this.commands) {
      const [ firstCmd, ...extraArgs ] = argv;

      if (command.cmd === firstCmd || command.alias.includes(String(firstCmd))) {
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
    if (!result) return result;

    const { command, args } = result;
    const parserOption: parser.Options = {};
    for (const key in command.options.meta) {
      const opt = command.options.meta[key];
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
