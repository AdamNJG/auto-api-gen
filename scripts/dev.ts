import { loadConfig } from '../dist/configLoader/configLoader.js';
import generateServer from '../dist/serverGenerator/serverGenerator.js';
import chokidar from 'chokidar';
import { spawn } from 'child_process';
import debounce from 'lodash.debounce';
import { build } from 'esbuild';
import { AutoApiConfig } from '../dist/configLoader/types.js';

export async function runDevProcesses () {
  const config = await loadConfig();

  if (!config) {
    console.error('no config found, make one called autoapi.config.ts');
    process.exit(1);
  }

  const result = await generateServer();

  if (!result.success) {
    process.exit(1);
  }

  const apiWatchList: string[] = [config.api_folders.map(f => f.directory), config.middleware_folder]
    .flat()
    .filter(f => f !== undefined);

  const apiWatcher = chokidar.watch(apiWatchList.map(f => f), {
    ignoreInitial: true
  });

  const rebuildServer = debounce(async () => {
    console.log('[DEV] Rebuilding server...');
    const result = await generateServer();

    if (!result.success) {
      console.error('[DEV] Server generation failed. Fix the error and restart the CLI.');
      process.exit(1);
    }
    
  }, 300);

  apiWatcher.on('all', rebuildServer);

  spawn('nodemon', ['generated/index.ts'], {
    stdio: 'inherit',
    shell: true
  });
}

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runDevProcesses();
}