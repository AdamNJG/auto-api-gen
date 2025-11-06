#!/usr/bin/env node

import { argv } from 'node:process';
import { runDevProcesses } from './dev.js';
import { runBuild } from './build.js';

const command = argv[2];

switch (command) {
case 'dev':{
  await runDevProcesses();
  break; 
}
case 'build': {
  await runBuild();
  break;
}
default:
  console.log(`Unknown command: ${command}`);
  process.exit(1);
}
