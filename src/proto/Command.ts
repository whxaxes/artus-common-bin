import { Inject } from '@artus/core';
import { Context } from '@artus/pipeline';
import { MetadataEnum } from '../constant';
import compose from 'koa-compose';
import { CommandInfo } from './CommandInfo';

export abstract class Command {
  abstract run(...args: any[]): Promise<any>;
}

export class EmptyCommand extends Command {
  async run() {
    // nothing
  }
}
