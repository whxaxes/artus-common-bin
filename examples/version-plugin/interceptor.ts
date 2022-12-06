import fs from 'fs/promises';
import path from 'path';
import { ArtusInjectEnum } from '@artus/core';
import { Context } from '@artus/pipeline';
import { CommandInfo, CommonBinConfig } from 'artus-common-bin';

export async function interceptor(ctx: Context, next) {
  const cmdInfo = ctx.container.get(CommandInfo);
  const { fuzzyMatched: matched, args } = cmdInfo.matchResult;
  if (!matched.isRoot || !args.version) {
    return await next();
  }

  const config: CommonBinConfig = ctx.container.get(ArtusInjectEnum.Config);
  const pkgPath = path.resolve(config.baseDir, './package.json');
  const pkgInfo = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
  console.info(cmdInfo.bin, pkgInfo.version || '1.0.0');
}
