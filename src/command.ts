import { addTag, Injectable, ScopeEnum } from '@artus/core';
import { MetadataEnum } from './constant';
import { RequireExactlyOne } from 'type-fest';

export interface CommandProps {
  command: string;
  description?: string;
  alias?: string | string[];
  parent?: typeof Command;
}

export interface OptionProps {
  type?: string;
  description?: string;
  alias?: string | string[];
  default?: any;
  required?: boolean;
}

export interface OptionMeta<T extends string = string> {
  key: string;
  meta: Record<T, OptionProps>;
}

export abstract class Command {
  abstract run(...args: any[]): Promise<any>;
}

export function DefineCommand(meta: CommandProps) {
  return (target: any) => {
    Reflect.defineMetadata(MetadataEnum.COMMAND, meta, target);
    addTag(MetadataEnum.COMMAND, target);
    Injectable({ scope: ScopeEnum.EXECUTION })(target);
    return target;
  };
}

export function DefineSubCommand(meta: RequireExactlyOne<CommandProps, 'parent'>) {
  return DefineCommand(meta);
}

export function DefineOption<T extends object = object>(meta?: Record<keyof T, OptionProps>) {
  return (target: any, key: string) => {
    Reflect.defineMetadata(
      MetadataEnum.OPTION,
      { key, meta } satisfies OptionMeta,
      target.constructor,
    );
  };
}
