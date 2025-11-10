import { File } from '../manifestGenerator/types.js';
import { GenerateEndpointsResults } from './types.js';
import * as path from 'path';
import ManifestGenerator, { ControllerManifest } from '../manifestGenerator/manifestGenerator.js';
import { makeDirectory, writeFile } from '../fileHelpers.js';
import MiddlewareAggregator from '../middlewareAggregator/middlewareAggregator.js';
import FileBuilder from '../FileBuilder.js';

type EndpointDefinition = {
  definition: string, 
  hasMiddleware: boolean
};

export default class EndpointGenerator {
  private sourceDirectory: string;
  private outputPath: string;
  private routeMiddleware: string[];
  private middlewareAggregator: MiddlewareAggregator | undefined;

  constructor (sourceDirectory: string, 
    outputPath: string, 
    routeMiddleware: string[], 
    middlewareAggregator: MiddlewareAggregator | undefined) 
  {
    this.sourceDirectory = sourceDirectory;
    this.outputPath = outputPath;
    this.routeMiddleware = routeMiddleware;
    this.middlewareAggregator = middlewareAggregator;
  }

  public async generateEndpoints () : Promise<GenerateEndpointsResults> {
    const manifestGenerator = new ManifestGenerator(this.sourceDirectory, 'handler');
    const manifest: ControllerManifest = await manifestGenerator.createManifest();

    if (manifest.endpoints.length == 0) {
      console.error(`No endpoints found to map for ${this.sourceDirectory}`);
      return {
        success: false
      };
    }

    const routerDefinitions = this.getEndpointDefinitions(manifest);

    const shouldAddMiddlewareImport = EndpointGenerator.hasRouteMiddleware(this.routeMiddleware) 
      || EndpointGenerator.hasEndpointMiddleware(routerDefinitions.map(rd => rd.hasMiddleware));

    return await this.writeRouteFile(this.buildFile(manifest.endpoints, 
      shouldAddMiddlewareImport, 
      EndpointGenerator.hasRouteMiddleware(this.routeMiddleware)
        ? this.getMiddlewareStatements(this.routeMiddleware)
        : [], 
      routerDefinitions.map(r => r.definition)));
  }

  private async writeRouteFile (file: string) { 
    const dirResult = await makeDirectory(path.dirname(this.outputPath));

    if (!dirResult.success) {
      console.error(`Error creating the directory: ${path.dirname(this.outputPath)}: `, dirResult.error);
      return {
        success: false
      };
    }

    const writeResult = await writeFile(this.outputPath, file);
    if (!writeResult.success) {
      console.error(`Error writing the file: ${this.outputPath}: `, writeResult.error);
      return {
        success: false
      };
    }
    
    return {
      success: true
    };
  }

  private static hasRouteMiddleware = (routeMiddleware: string[]) : boolean => routeMiddleware.length > 0;

  private static hasEndpointMiddleware = (resultList: boolean[]) : boolean => resultList.some(r => r === true);
  
  private getEndpointDefinitions (manifest: ControllerManifest) : EndpointDefinition[] {
    return manifest.endpoints.map(e => this.getEndpointDefinition(e));
  } 

  private getEndpointDefinition (endpoint: File): EndpointDefinition {
    const endpointMiddleware = this.middlewareAggregator?.getAvailableMiddleware(endpoint.config.middleware) ?? [];
    const middlewareStatement = this.getEndpointMiddlewareStatement(endpointMiddleware);

    return {
      definition: `router.${endpoint.config.httpMethod.toLowerCase()}('${endpoint.route}', ${middlewareStatement !== '' ? `${middlewareStatement}, `: ''}${endpoint.config.handlerName});`,
      hasMiddleware: endpointMiddleware.length > 0
    };
  }

  private getEndpointMiddlewareStatement (middleware: string[]) : string {
    if (middleware.length === 0) return '';

    return middleware.map(m => `middleware['${m}']`).join(', ');
  }

  private mapHandlerImport (endpoint: File) {
    const routerDir = path.dirname(this.outputPath);
    const handlerPath = path.resolve(endpoint.path);

    let relativePath = path.relative(routerDir, handlerPath).replace(/\\/g, '/');

    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

    if (endpoint.config.isHandlerDefaultExport) {
      return `import ${endpoint.config.handlerName} from '${relativePath}';`;
    } else {
      return `import { handler as ${endpoint.config.handlerName} } from '${relativePath}';`;
    }
  }

  private mapMiddlewareImport () { 
    const routerDir = path.dirname(this.outputPath);
    const middlewarePath = path.resolve('generated/middleware.ts');

    let relativePath = path.relative(routerDir, middlewarePath).replace(/\\/g, '/');

    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

    return `import middleware from '${relativePath}';`;
  }

  private getMiddlewareStatements (middlewareList: string[]): string[] {
    const statements: string[] = [];
    for (const middleware of middlewareList) {
      statements.push(`router.use(middleware['${middleware}']);`);
    }

    return statements;
  }

  private buildFile (endpoints: File[], shouldAddMiddlewareImport: boolean, middlewareStatements: string[], routerDefinitions: string[]) {
    const fileBuilder = FileBuilder.buildFile()
      .addLine(`import express from 'express';`)
      .addLines(endpoints.map((e) => this.mapHandlerImport(e)));

    if (shouldAddMiddlewareImport) {
      fileBuilder.addLine(this.mapMiddlewareImport());
    }

    fileBuilder
      .addEmptyLine()
      .addLine('const router = express.Router();');

    if (EndpointGenerator.hasRouteMiddleware(this.routeMiddleware) && middlewareStatements.length > 0) {
      fileBuilder.addLines(middlewareStatements);
    }

    fileBuilder.addLines(routerDefinitions)
      .addEmptyLine()
      .addLine('export default router;');

    return fileBuilder.getFile();
  }
}
