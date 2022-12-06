import { addTag, Injectable, ScopeEnum } from '@artus/core';
import { MetadataEnum } from './constant';
import { Middleware as MiddlewareFunction } from '@artus/pipeline';
import { CommandProps, OptionProps, OptionMeta, CommandMeta } from './types';

export function DefineCommand(
  opt?: CommandProps,
  option?: { override?: boolean; },
) {
  return (target: any) => {
    let meta: CommandMeta = { ...opt };

    // merge meta of prototype
    if (!option?.override) {
      const protoMeta = Reflect.getMetadata(MetadataEnum.COMMAND, Object.getPrototypeOf(target));
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
      const protoMeta = Reflect.getMetadata(MetadataEnum.OPTION, Object.getPrototypeOf(ctor));
      meta = Object.assign({}, protoMeta?.meta, meta);
    }

    Reflect.defineMetadata(
      MetadataEnum.OPTION,
      { key, meta } satisfies OptionMeta,
      ctor,
    );
  };
}

export function Middleware(
  fn: MiddlewareFunction | MiddlewareFunction[],
  option?: { override?: boolean; mergeType?: 'before' | 'after' },
) {
  return (target: any) => {
    let existsFns: MiddlewareFunction[] = Reflect.getMetadata(MetadataEnum.MIDDLEWARE, target);
    const fns = Array.isArray(fn) ? fn : [ fn ];

    // merge meta of prototype
    if (!option?.override && !existsFns) {
      const protoMeta = Reflect.getMetadata(MetadataEnum.MIDDLEWARE, Object.getPrototypeOf(target));
      existsFns = protoMeta;
    }

    existsFns = existsFns || [];
    if (!option?.mergeType || option?.mergeType === 'after') {
      existsFns = existsFns.concat(fns);
    } else {
      existsFns = fns.concat(existsFns);
    }

    Reflect.defineMetadata(MetadataEnum.MIDDLEWARE, existsFns, target);
    return target;
  };
}
