import { addTag, Injectable, ScopeEnum, Inject } from '@artus/core';
import { MetadataEnum } from './constant';
import { ParsedCommands, checkCommandCompatible } from './proto/ParsedCommands';
import { CommandInfo } from './proto/CommandInfo';
import compose from 'koa-compose';
import { Context, Middleware as MiddlewareFunction } from '@artus/pipeline';
import { CommandProps, OptionProps, OptionMeta, CommandMeta } from './types';
const CONTEXT_SYMBOL = Symbol('Command#Context');

interface CommonDeoratorOption {
  /** whether merge meta info of prototype */
  override?: boolean;
}

export function DefineCommand(
  opt?: CommandProps,
  option?: CommonDeoratorOption,
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

    // inject ctx to proto
    Inject(Context)(target, CONTEXT_SYMBOL);
    const runMethod = target.prototype.run;
    Object.defineProperty(target.prototype, 'run', {
      async value(...args: any[]) {
        const ctx: Context = this[CONTEXT_SYMBOL];
        // compose with middlewares
        const middlewares = Reflect.getMetadata(MetadataEnum.MIDDLEWARE, target) || [];
        return await compose([
          ...middlewares,
          async () => await runMethod.apply(this, args),
        ])(ctx);
      },
    });

    return target;
  };
}

export function DefineOption<T extends object = object>(
  meta?: { [P in keyof T]?: OptionProps; },
  option?: CommonDeoratorOption,
) {
  return (target: any, key: string) => {
    const ctor = target.constructor;

    // merge meta of prototype
    if (!option?.override) {
      const protoMeta = Reflect.getMetadata(MetadataEnum.OPTION, Object.getPrototypeOf(ctor));
      meta = Object.assign({}, protoMeta?.meta, meta);
    }

    // define option key
    const keySymbol = Symbol(`${ctor.name}#${key}`);
    Object.defineProperty(ctor.prototype, key, {
      get() {
        if (this[keySymbol]) return this[keySymbol];
        const ctx: Context = this[CONTEXT_SYMBOL];
        const { matched, args, raw: argv } = ctx.container.get(CommandInfo);
        const parsedCommands = ctx.container.get(ParsedCommands);
        const targetCommand = parsedCommands.getCommand(ctor);
        // check target command whether is compatible with matched
        const isSameCommandOrCompatible = matched.clz === ctor || checkCommandCompatible(targetCommand, matched);
        this[keySymbol] = isSameCommandOrCompatible ? args : parsedCommands.parseArgs(argv, targetCommand);
        return this[keySymbol];
      },

      set(val: any) {
        // allow developer to override options
        this[keySymbol] = val;
      },
    });

    Reflect.defineMetadata(
      MetadataEnum.OPTION,
      { key, meta } satisfies OptionMeta,
      ctor,
    );
  };
}

export function Middleware(
  fn: MiddlewareFunction | MiddlewareFunction[],
  option?: CommonDeoratorOption & { mergeType?: 'before' | 'after' },
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
