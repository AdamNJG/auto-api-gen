import { File } from './types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ControllerManifest, createManifest } from './manifestGenerator.js';
import { pathToFileURL } from 'url';
import { Router } from 'express';

export default class EndpointGenerator {
  private sourceDirectory: string;
  private outputPath: string;

  private constructor (dirPath: string, outputFilePath: string) { 
    this.sourceDirectory = dirPath;
    this.outputPath = outputFilePath;
  }

  static async create (dirPath: string, outputFilePath: string) : Promise<EndpointGenerator> {
    const endpointGenerator = new EndpointGenerator(dirPath, outputFilePath); 

    await endpointGenerator.generateEndpoints();

    return endpointGenerator;
  }

  async generateEndpoints () {
    const manifest: ControllerManifest = await createManifest(this.sourceDirectory);

    if (manifest.endpoints.length == 0) {
      console.error(`No endpoints found to map for ${this.sourceDirectory}`);
      return;
    }

    const routerDefinitions = manifest.endpoints.map(EndpointGenerator.getRouterDefinition)
      .join(';\n') + ';';

    const gen = `import express from 'express';
${manifest.endpoints.map(this.mapHandlerImport).join('\n')}

const router = express.Router();

${routerDefinitions}

export default router;
    `;

    await fs.mkdir(path.dirname(this.outputPath), { recursive: true });
    await fs.writeFile(this.outputPath, gen, 'utf8');
    console.log(`generated endpoints: ${this.outputPath}`);
  }
  
  static getRouterDefinition (endpoint: File): string {
    return `router.${endpoint.config.httpMethod.toLowerCase()}('${endpoint.route}', ${endpoint.config.handlerName})`;
  }

  async getRouter (): Promise<Router | undefined> {
    const absPath = path.resolve(this.outputPath);

    const fileUrl = pathToFileURL(absPath).href;
    try {
      const router = await import(fileUrl);
      if (router.default instanceof Router) {
        return router.default;
      }
    } catch (error) {
      console.error(`No router found in ${this.outputPath}:`, error);
      return undefined;
    }
  }

  mapHandlerImport (endpoint: File) {
    if (endpoint.config.isHandlerDefaultExport) {
      return `import ${endpoint.config.handlerName} from '../${endpoint.path}'`;
    } 

    return `import {handler as ${endpoint.config.handlerName}} from '../${endpoint.path}'`;
  }
}

