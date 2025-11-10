import { loadConfig } from '../dist/configLoader/configLoader.js';
import { build } from 'esbuild';
import { AutoApiConfig } from '../dist/configLoader/types.js';
import ServerGenerator from '../dist/serverGenerator/serverGenerator.js';

export async function runBuild () {
  const config = await loadConfig();

  if (!config) {
    console.error('no config found, make one called autoapi.config.ts');
    process.exit(1);
  }
  const serverGenerator = new ServerGenerator(config);
  const result = await serverGenerator.generateServer();

  if (!result.success) {
    console.error('Server generation failed.');
    process.exit(1);
  }

  const rollupResult = await rollupServer(config);

  if (!rollupResult.success) {
    console.error('Server bundling failed.');
    process.exit(1);
  }

  console.log('✅ Production server build complete!');
}

if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runBuild();
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
      minify: true,      
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