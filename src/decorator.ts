import { addTag, Injectable, ScopeEnum, Inject } from '@artus/core';
import { MetadataEnum } from './constant';
import { ParsedCommands, checkCommandCompatible } from './proto/ParsedCommands';
import { CommandInfo } from './proto/CommandInfo';
import compose from 'koa-compose';
import { Context, Middleware as MiddlewareFunction } from '@artus/pipeline';
import { CommandProps, OptionProps, OptionMeta, CommandMeta } from './types';
export const CONTEXT_SYMBOL = Symbol('Command#Context');
export const EXCUTION_SYMBOL = Symbol('Command#Excution');

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

    // default command is main command
    meta.command = meta.command || '$0';
    Reflect.defineMetadata(MetadataEnum.COMMAND, meta, target);
    addTag(MetadataEnum.COMMAND, target);
    Injectable({ scope: ScopeEnum.EXECUTION })(target);

    wrapWithMiddleware(target);
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
  return (target: any, key?: string) => {
    if (key && key !== 'run') throw new Error('Middleware can only be used in Command Class or run method');

    const ctor = key ? target.constructor : target;
    const metaKey = key ? MetadataEnum.RUN_MIDDLEWARE : MetadataEnum.MIDDLEWARE;
    let existsFns: MiddlewareFunction[] = Reflect.getOwnMetadata(metaKey, ctor);
    const fns = Array.isArray(fn) ? fn : [ fn ];

    // merge meta of prototype, only works in class
    if (!key && !option?.override && !existsFns) {
      const protoMeta = Reflect.getOwnMetadata(MetadataEnum.MIDDLEWARE, Object.getPrototypeOf(ctor));
      existsFns = protoMeta;
    }

    existsFns = existsFns || [];
    if (!option?.mergeType || option?.mergeType === 'after') {
      existsFns = existsFns.concat(fns);
    } else {
      existsFns = fns.concat(existsFns);
    }

    Reflect.defineMetadata(metaKey, existsFns, ctor);
    return ctor;
  };
}

/**
 * wrap middleware logic in command class
 */
function wrapWithMiddleware(clz) {
  // inject ctx to proto
  Inject(Context)(clz, CONTEXT_SYMBOL);

  // override run method
  const runMethod = clz.prototype.run;
  Object.defineProperty(clz.prototype, 'run', {
    async value(...args: any[]) {
      const ctx: Context = this[CONTEXT_SYMBOL];
      // compose with middlewares in run method
      const middlewares = Reflect.getOwnMetadata(MetadataEnum.RUN_MIDDLEWARE, clz) || [];
      return await compose([
        ...middlewares,
        async () => await runMethod.apply(this, args),
      ])(ctx);
    },
  });

  // add execution method
  Object.defineProperty(clz.prototype, EXCUTION_SYMBOL, {
    async value(...args: any[]) {
      const ctx: Context = this[CONTEXT_SYMBOL];
      // compose with middlewares in Command Class
      const middlewares = Reflect.getOwnMetadata(MetadataEnum.MIDDLEWARE, clz) || [];
      return await compose([
        ...middlewares,
        async () => await this.run(...args),
      ])(ctx);
    },
  });
}
