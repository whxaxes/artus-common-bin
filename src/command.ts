import { addTag, Injectable, ScopeEnum } from '@artus/core';
import { MetadataEnum } from './constant';

export interface CommandProps {
  command?: string;
  description?: string;
  alias?: string | string[];
}

export interface OptionProps {
  type?: string;
  alias?: string | string[];
  default?: any;
  description?: string;
}

export interface OptionMeta<T extends string = string> {
  key: string;
  meta: Record<T, OptionProps>;
}

export interface CommandMeta extends CommandProps {
  // nothing
}

export abstract class Command {
  abstract run(...args: any[]): Promise<any>;
}

export class EmptyCommand extends Command {
  async run() {
    // nothing
  }
}

function inheritMetadata(target: any) {

}

export function DefineCommand(
  opt?: CommandProps,
  option?: { override?: boolean; },
) {
  return (target: any) => {
    let meta: CommandMeta = { ...opt };

    // merge meta of prototype
    if (!option?.override) {
      let proto = Object.getPrototypeOf(target);
      while (proto && proto !== Command) {
        const protoMeta = Reflect.getMetadata(MetadataEnum.COMMAND, proto);
        if (protoMeta) meta = Object.assign({}, protoMeta, meta);
        proto = Object.getPrototypeOf(proto);
      }
    }

    Reflect.defineMetadata(MetadataEnum.COMMAND, meta, target);
    addTag(MetadataEnum.COMMAND, target);
    Injectable({ scope: ScopeEnum.EXECUTION })(target);
    return target;
  };
}

export function Option<T extends object = object>(
  meta?: { [P in keyof T]?: OptionProps; },
  option?: { override?: boolean; },
) {
  return (target: any, key: string) => {
    const ctor = target.constructor;

    // merge meta of prototype
    if (!option?.override) {
      let proto = Object.getPrototypeOf(ctor);
      while (proto && proto !== Command) {
        const protoMeta = Reflect.getMetadata(MetadataEnum.OPTION, proto);
        if (protoMeta) meta = Object.assign({}, protoMeta.meta, meta);
        proto = Object.getPrototypeOf(proto);
      }
    }

    Reflect.defineMetadata(
      MetadataEnum.OPTION,
      { key, meta } satisfies OptionMeta,
      ctor,
    );
  };
}
