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

  const rollupResult = await rollupServer(config);

  if (!rollupResult.success) {
    process.exit(1);
  }

  let currentProcess: ReturnType<typeof spawn> | null = null;
  const generatedWatcher = chokidar.watch('out', {
    ignoreInitial: false
  });

  generatedWatcher.on('all', async () => {
    if (currentProcess) {
      currentProcess.kill();
    }

    currentProcess = spawn('node', ['./out/server.cjs'], {
      stdio: 'inherit'
    });
  }); 

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

    const rollupResult = await rollupServer(config);

    if (!rollupResult.success) {
      process.exit(1);
    }
  }, 300);

  apiWatcher.on('all', rebuildServer);
}

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runDevProcesses();
}

export function awaitSpawn (command: string, args: string[] = [], options: any = {}) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      shell: true,           // ✅ handles npm.cmd on Windows
      stdio: 'inherit',      // show output directly
      ...options
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

async function rollupServer (config: AutoApiConfig) : Promise<{success: boolean}> {

  try {
    await build({
      entryPoints: ['generated/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: 'out/server.cjs',
      sourcemap: true,
      external: config.rollupExternals ?? []
    });
    console.log('server compiled');
    return {
      success: true
    };
  } catch (err) {
    console.error('server compilation failed', err);
    return {
      success: false
    };
  }
}