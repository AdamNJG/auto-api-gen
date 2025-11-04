import { loadConfig } from '../configLoader/configLoader.js';
import generateEndpoints from '../endpointGenerator/endpointGenerator.js';
import path from 'path';
import { AutoApiConfig } from '../configLoader/types.js';
import { GenerateServerResult, RouterMapping } from './types.js';
import aggregateMiddleware from '../middlewareAggregator/middlewareAggregator.js';
import { makeDirectory, writeFile, exists, readDirectory } from '../fileHelpers.js';

const defaultGenerated = './generated';

export default async function generateServer (configLocationOverride: string | undefined = undefined) : Promise<GenerateServerResult> { 
  const config = await loadConfig(configLocationOverride);
  
  if (!config) {
    console.error('No config found, please create an autoapi.config, check the documentation for details');
    return {
      success: false
    };
  }

  const dirResult = await makeDirectory(path.dirname(defaultGenerated));

  if (!dirResult.success) {
    console.error(`Error creating the directory: ${path.dirname(defaultGenerated)}: `, dirResult.error);
    return {
      success: false
    };
  }

  const routerMappings: Record<string, RouterMapping> = {};
  for (const apiFolder of config.api_folders) {
    const result = await generateEndpoints(apiFolder.directory, path.join(defaultGenerated, apiFolder.directory.replace('./', '') + '.ts'));
    if (result.success) {
      console.log(`generated endpoints: ${defaultGenerated}/${apiFolder.directory}.ts`);
      routerMappings[apiFolder.api_slug] = mapRouterImport(apiFolder.directory);
    }
  }

  if (Object.keys(routerMappings).length === 0) {
    console.error('No valid api files able to be created from the config and file system, exiting creation');
    return {
      success: false
    };
  }

  if (config.middleware_folder) {
    const result = await aggregateMiddleware('./' + config.middleware_folder, path.join(defaultGenerated, 'middleware.ts'));
    if (result.success) {
      console.log(`middleware aggregation created at ${defaultGenerated}/middleware.ts`);
    }
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
  const preRunScriptImports = await getPreRunScriptImports(config);

  console.log(preRunScriptImports);

  const index = `${preRunScriptImports.map(e => e + ';\n')}import express from 'express';
${Object.values(routerMappings).map(r => r.import + ';')}${shouldAddMiddleware(config) ? `\nimport middleware from './middleware.js';` : ''}

const app = express();${shouldAddMiddleware(config) ? `\nconst appMiddleware = ['${config.app_middleware?.map(m => m)}'];\n` : ''}

${Object.entries(routerMappings).map(([key, r]) => `app.use('${key}',${shouldAddMiddleware(config) ? ' appMiddleware.map(k => middleware[k]),' : ''} ${r.importName});`)}

app.listen(${config.port}, () => {
  console.log('Example app listening on port ${config.port}'); 
}); 
  `;

  const writeResult = await writeFile(`${defaultGenerated}/index.ts`, index);
  if (!writeResult.success) {
    console.error(`Error writing the file: ${defaultGenerated}/index.ts: `, writeResult.error);
    return;
  }
    
  console.log(`generated server entrypoint: ${defaultGenerated}/index.ts`);
}

function shouldAddMiddleware (config: AutoApiConfig): boolean {
  return Boolean(config.middleware_folder !== undefined && config.app_middleware !== undefined);
}

async function getPreRunScriptImports (config: AutoApiConfig): Promise<string[]> { 
  if (config.pre_run_scripts === undefined) {
    return [];
  }

  const resolvedDirectory = path.resolve(process.cwd(), config.pre_run_scripts);

  if (!exists(resolvedDirectory)) { 
    console.log('no exist!', resolvedDirectory);
    return [];
  }

  const entries = await readDirectory(config.pre_run_scripts);

  if (!entries.success) {
    console.log('no pre-run scripts found');
    return [];
  }

  const resolvedGenerated = path.resolve(process.cwd(), defaultGenerated);

  return entries.content
    .map(e => path.relative(resolvedGenerated, path.join(resolvedDirectory, e)).replace(/\\/g, '/'))
    .map(e => `import '${e}'`);
}