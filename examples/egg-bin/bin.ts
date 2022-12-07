#!/usr/bin/env node

import '../common';
import { start } from 'artus-common-bin';

start({ baseDir: __dirname })
  .catch(console.error);
