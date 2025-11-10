import path from 'path';
import { AutoApiConfig } from '../configLoader/types.js';
import { GenerateServerResult, RouterMapping } from './types.js';
import MiddlewareAggregator from '../middlewareAggregator/middlewareAggregator.js';
import { makeDirectory, writeFile, exists, readDirectory } from '../fileHelpers.js';
import EndpointGenerator from '../endpointGenerator/endpointGenerator.js';

const defaultGenerated = './generated';

type FindMiddlewareResult = {
  appMiddleware: string[],
  aggregator: MiddlewareAggregator | undefined
}

export default class ServerGenerator {
  private config: AutoApiConfig;

  public constructor (config: AutoApiConfig) {
    this.config = config;
  }

  async generateServer () : Promise<GenerateServerResult> { 
    const dirResult = await makeDirectory(path.dirname(defaultGenerated));

    if (!dirResult.success) {
      console.error(`Error creating the directory: ${defaultGenerated}: `, dirResult.error);
      return {
        success: false
      };
    }

    const middleware = await this.findMiddleware();

    const routerMappings = await this.createAndMapRouters(middleware.aggregator);

    if (Object.keys(routerMappings).length === 0) {
      console.error('No valid api files able to be created from the config and file system, exiting creation');
      return {
        success: false
      };
    }

    await this.generateIndex(routerMappings, middleware.appMiddleware);
    return {
      success: true
    };
  }

  mapRouterImport (routerPath: string): RouterMapping {
    const importName = path.basename(routerPath);
    return { import: `import ${importName} from './${routerPath}.ts'`, importName: importName };
  }

  async generateIndex (routerMappings: Record<string, RouterMapping>, foundAppMiddleware: string[]) {
    const preRunScriptImports = await this.getPreRunScriptImports(this.config);
    const canAddMiddleware: boolean = foundAppMiddleware.length > 0;

    const index = `${preRunScriptImports.map(e => e + ';\n')}import express from 'express';
${Object.values(routerMappings).map(r => r.import + ';')}${canAddMiddleware ? `\nimport middleware from './middleware.ts';` : ''}

const app = express();${canAddMiddleware ? `\nconst appMiddleware = [${foundAppMiddleware.map(m => `'${m}'`).join(', ')}];` : ''}

${Object.entries(routerMappings).map(([key, r]) => `app.use('${key}',${canAddMiddleware ? ' appMiddleware.map(k => middleware[k]),' : ''} ${r.importName});`)}

app.listen(${this.config.port}, () => {
  console.log('Example app listening on port ${this.config.port}'); 
}); 
  `;

    const writeResult = await writeFile(`${defaultGenerated}/index.ts`, index);
    if (!writeResult.success) {
      console.error(`Error writing the file: ${defaultGenerated}/index.ts: `, writeResult.error);
      return;
    }
    
    console.log(`generated server entrypoint: ${defaultGenerated}/index.ts`);
  }

  async getPreRunScriptImports (config: AutoApiConfig): Promise<string[]> { 
    if (config.pre_run_scripts === undefined) {
      return [];
    }

    const resolvedDirectory = path.resolve(process.cwd(), config.pre_run_scripts);

    if (!exists(resolvedDirectory)) { 
      console.log('The directory for prescripts does not exist: ', config.pre_run_scripts);
      return [];
    }

    const entries = await readDirectory(config.pre_run_scripts);

    if (!entries.success || entries.content.length === 0) {
      console.log('No pre-run scripts found in: ', config.pre_run_scripts);
      return [];
    }

    const resolvedGenerated = path.resolve(process.cwd(), defaultGenerated);

    return entries.content
      .map(e => path.relative(resolvedGenerated, path.join(resolvedDirectory, e)).replace(/\\/g, '/'))
      .map(e => `import '${e}'`);
  }

  async findMiddleware (): Promise<FindMiddlewareResult> {
    if (!this.config.middleware_folder) return {
      appMiddleware: [],
      aggregator: undefined
    };

    const middlewareAggregator = new MiddlewareAggregator(this.config.middleware_folder, path.join(defaultGenerated, 'middleware.ts'));
    const result = await middlewareAggregator.aggregateMiddleware();
    if (!result.success) return {    
      appMiddleware: [],
      aggregator: undefined
    };

    console.log(`middleware aggregation created at ${defaultGenerated}/middleware.ts`);

    return {
      appMiddleware: middlewareAggregator.getAvailableMiddleware(this.config.app_middleware ?? []), 
      aggregator: middlewareAggregator
    };
  } 

  async createAndMapRouters (middlewareAggregator: MiddlewareAggregator | undefined) {
    const routerMappings: Record<string, RouterMapping> = {};

    for (const apiFolder of this.config.api_folders) {
      const routeMiddleware = middlewareAggregator !== undefined && apiFolder.middleware !== undefined ? middlewareAggregator.getAvailableMiddleware(apiFolder.middleware) : [];
      const endpointGenerator = new EndpointGenerator(apiFolder.directory, path.join(defaultGenerated, apiFolder.directory.replace('./', '') + '.ts'), routeMiddleware, middlewareAggregator);
      const result = await endpointGenerator.generateEndpoints();
      if (!result.success) continue;

      console.log(`generated endpoints: ${defaultGenerated}/${apiFolder.directory}.ts`);
      routerMappings[apiFolder.api_slug] = this.mapRouterImport(apiFolder.directory);
    }
    return routerMappings;
  }
}
