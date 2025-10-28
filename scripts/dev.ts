import { loadConfig } from '../dist/configLoader/configLoader.js';
import generateServer from '../dist/serverGenerator/serverGenerator.js';
import chokidar from 'chokidar';
import { spawn } from 'child_process';
import debounce from 'lodash.debounce';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export async function runDevProcesses () {
  const config = await loadConfig();

  if (!config) {
    console.error('no config found, make one called autoapi.config.ts');
    process.exit(1);
  }

  if (config.bootstrapDom) {
    try {
      require('jsdom');
    } catch {
      console.log('jsdom required, installing now!');
      await awaitSpawn('npm', ['install', 'jsdom'], {
        shell: true,
        stdio: 'inherit'
      });
      console.log('✅ jsdom installed successfully');
    }
  }

  const result = await generateServer();

  if (!result.success) {
    process.exit(1);
  }

  let currentProcess: ReturnType<typeof spawn> | null = null;
  const generatedWatcher = chokidar.watch('generated', {
    ignoreInitial: false
  });

  generatedWatcher.on('all', async () => {
    if (currentProcess) {
      currentProcess.kill();
    }

    currentProcess = spawn('node', ['./generated/index.js'], {
      stdio: 'inherit'
    });
  }); 

  const apiWatcher = chokidar.watch(config.api_folders.map(f => f.directory), {
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