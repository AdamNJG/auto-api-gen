import { loadConfig } from '../configLoader/configLoader.js';
import generateEndpoints from '../endpointGenerator/endpointGenerator.js';
import path from 'path';
import * as fs from 'fs/promises';
import { AutoApiConfig } from '../configLoader/types.js';
import { GenerateServerResult, RouterMapping } from './types.js';

export default async function generateServer (configLocationOverride: string | undefined = undefined) : Promise<GenerateServerResult> { 
  const config = await loadConfig(configLocationOverride);
  
  if (!config) {
    console.error('No config found, please create an autoapi.config, check the documentation for details');
    return {
      success: false
    };
  }

  try {
    await fs.mkdir(path.dirname('./generated'), { recursive: true });
  } catch (error) { 
    console.error(error);
    return {
      success: false
    };
  }

  const routerMappings: Record<string, RouterMapping> = {};
  for (const apiFolder of config.api_folders) {
    const result = await generateEndpoints(apiFolder.directory, path.join('./generated', apiFolder.directory.replace('./', '') + '.js'));
    if (result.success) {
      routerMappings[apiFolder.api_slug] = mapRouterImport(apiFolder.directory);
    }

  }

  if (Object.keys(routerMappings).length === 0) {
    console.error('No valid api files able to be created from the config and file system, exiting creation');
    return {
      success: false
    };
  }

  await generateIndex(routerMappings, config);
  return {
    success: true
  };
}

function mapRouterImport (routerPath: string): RouterMapping {
  const importName = path.basename(routerPath).replace('.js', '');
  return { import: `import ${importName} from './${routerPath}.js'`, importName: importName };
}

async function generateIndex (routerMappings: Record<string, RouterMapping>, config: AutoApiConfig) {
  const index = `import express from 'express';
${Object.values(routerMappings).map(r => r.import + ';')}

const app = express();

${Object.entries(routerMappings).map(([key, r]) => `app.use('${key}', ${r.importName});`)}

app.listen(${config.port}, () => {
  console.log('Example app listening on port ${config.port}'); 
}); 
  `;

  try {
    await fs.writeFile('./generated/index.js', index, 'utf8');
    console.log('generated server entrypoint: ./generated/index.js');
  } catch (error) { 
    console.error(error);
  }
}