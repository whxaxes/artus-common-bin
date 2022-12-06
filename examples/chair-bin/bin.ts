#!/usr/bin/env node

import '../common';
import { start } from 'artus-common-bin';

async function run() {
  await start({ baseDir: __dirname });
}

run().catch(console.error);
