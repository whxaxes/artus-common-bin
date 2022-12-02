#!/usr/bin/env node

import { start } from '../../src/index';

async function run() {
  await start({ baseDir: __dirname });
}

run().catch(console.error);
