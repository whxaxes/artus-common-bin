import 'reflect-metadata';
import { ArtusApplication, Scanner } from '@artus/core';

export * from '@artus/core';
export * from './command';
export * from './trigger';

export * from './proto/CommandInfo';
export * from './proto/ParsedCommands';

interface ApplicationOptions {
  name?: string;
  baseDir?: string;
}

export async function start(options ?: ApplicationOptions) {
  const baseDir = options.baseDir || process.cwd();
  process.env.ARTUS_COMMON_BIN_NAME = require(`${baseDir}/package.json`).name || 'bin';

  // scan app files
  const scanner = new Scanner({
    needWriteFile: false,
    configDir: 'config',
    extensions: [ '.ts' ],
  });

  const manifest = await scanner.scan(baseDir);

  // start app
  const app = new ArtusApplication();
  await app.load(manifest.default, baseDir);
  await app.run();
  return app;
}
