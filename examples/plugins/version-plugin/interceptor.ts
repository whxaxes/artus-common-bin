import fs from 'fs/promises';
import path from 'path';
import { ArtusInjectEnum } from '@artus/core';
import { Context } from '@artus/pipeline';
import { CommandContext, CommonBinConfig } from 'artus-common-bin';

export async function interceptor(ctx: Context, next) {
  const cmdCtx = ctx.container.get(CommandContext);
  const { fuzzyMatched: matched, args } = cmdCtx;
  if (!matched.isRoot || !args.version) {
    return await next();
  }

  const config: CommonBinConfig = ctx.container.get(ArtusInjectEnum.Config);
  const pkgPath = path.resolve(config.baseDir, './package.json');
  const pkgInfo = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
  console.info(cmdCtx.bin, pkgInfo.version || '1.0.0');
}
