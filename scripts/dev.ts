import { loadConfig } from '../dist/configLoader/configLoader.js';
import generateServer from '../dist/serverGenerator/serverGenerator.js';
import chokidar from 'chokidar';
import { spawn } from 'child_process';

export async function runDevProcesses () {
  const config = await loadConfig();

  if (!config) {
    console.error('no config found, make one called autoapi.config.ts');
    process.exit(1);
  }

  await generateServer();

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

  apiWatcher.on('all', async (event, pathChanged) => {
    console.log(`[DEV] ${event} detected in ${pathChanged}. Rebuilding...`);
    await generateServer();
  });

}

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runDevProcesses();
}
