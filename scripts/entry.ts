#!/usr/bin/env node

import { argv } from 'node:process';
import { runDevProcesses } from './dev.js';

//const execAsync = promisify(exec);

const command = argv[2];

switch (command) {
case 'dev':{
  await runDevProcesses();
  break; 
}
default:
  console.log(`Unknown command: ${command}`);
  process.exit(1);
}
