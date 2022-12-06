import { addTag, Injectable, ScopeEnum } from '@artus/core';
import { MetadataEnum } from './constant';
import { CommandProps, OptionProps, OptionMeta, CommandMeta } from './types';

export function DefineCommand(
  opt?: CommandProps,
  option?: { override?: boolean; },
) {
  return (target: any) => {
    let meta: CommandMeta = { ...opt };

    // merge meta of prototype
    if (!option?.override) {
      const proto = Object.getPrototypeOf(target);
      const protoMeta = Reflect.getMetadata(MetadataEnum.COMMAND, proto);
      meta = Object.assign({}, protoMeta, meta);
    }

    Reflect.defineMetadata(MetadataEnum.COMMAND, meta, target);
    addTag(MetadataEnum.COMMAND, target);
    Injectable({ scope: ScopeEnum.EXECUTION })(target);
    return target;
  };
}

export function DefineOption<T extends object = object>(
  meta?: { [P in keyof T]?: OptionProps; },
  option?: { override?: boolean; },
) {
  return (target: any, key: string) => {
    const ctor = target.constructor;

    // merge meta of prototype
    if (!option?.override) {
      const proto = Object.getPrototypeOf(ctor);
      const protoMeta = Reflect.getMetadata(MetadataEnum.OPTION, proto);
      meta = Object.assign({}, protoMeta?.meta, meta);
    }

    Reflect.defineMetadata(
      MetadataEnum.OPTION,
      { key, meta } satisfies OptionMeta,
      ctor,
    );
  };
}

export function Middleware() {

}
