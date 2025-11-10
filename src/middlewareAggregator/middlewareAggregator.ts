import ManifestGenerator from '../manifestGenerator/manifestGenerator.js';
import { File } from '../manifestGenerator/types.js';
import path from 'path';
import FileBuilder from '../fileBuilder.js';
import { makeDirectory, writeFile } from '../fileHelpers.js';

type GenerateMiddlewareResult = GenerateMiddlewareSuccess | GenerateMiddlewareFailure;

type GenerateMiddlewareSuccess = {
  success: true;
}

type GenerateMiddlewareFailure = {
  success: false;
}

type MiddlewareMappingInfo = {
  middleWareName: string,
  mappedFunctionName: string,
  import: string
}

export default class MiddlewareAggregator {
  private sourceDirectory: string;
  private outputPath: string;
  private mappings: MiddlewareMappingInfo[];

  public constructor (sourceDirectory: string, outputPath: string) {
    this.sourceDirectory = sourceDirectory;
    this.outputPath = outputPath;
    this.mappings = [];
  }

  public async aggregateMiddleware () : Promise<GenerateMiddlewareResult> {
    const manifestGenerator = new ManifestGenerator(this.sourceDirectory, 'middleware');
    const manifest = await manifestGenerator.createManifest();

    if (manifest.endpoints.length === 0) {
      console.error(`No middleware found in folder: ${this.sourceDirectory}`);
      return {
        success: false
      };
    }

    for (const file of manifest.endpoints) { 
      this.mappings.push({
        middleWareName: this.getMiddlewareName(file.path),
        mappedFunctionName: file.config.handlerName,
        import: this.mapMiddlewareImport(file)
      });
    }

    return await this.generateMiddlewareFile();
  }

  public getAvailableMiddleware (requestedMiddleware: string[]) {
    return requestedMiddleware.filter(m =>this.mappings.some(mapping => mapping.middleWareName === m));
  }

  private mapMiddlewareImport (endpoint: File) {
    const routerDir = path.dirname(this.outputPath);
    const handlerPath = path.resolve(endpoint.path);

    let relativePath = path.relative(routerDir, handlerPath).replace(/\\/g, '/');

    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

    if (endpoint.config.isHandlerDefaultExport) {
      return `import ${endpoint.config.handlerName} from '${relativePath}'`;
    } else {
      return `import { middleware as ${endpoint.config.handlerName} } from '${relativePath}'`;
    }
  }

  private async generateMiddlewareFile () : Promise<GenerateMiddlewareResult> {
    const middlewareFile = FileBuilder
      .buildFile()
      .addLine(this.mappings.map(m => `${m.import};`).join('\n'))
      .addEmptyLine()
      .addLine(`const middleware = {
${this.mappings.map(m => `  '${m.middleWareName}': ${m.mappedFunctionName}`).join(',\n')}
};`)
      .addEmptyLine()
      .addLine('export default middleware;')
      .getFile();

    const writeResult = await this.writeMiddlewareFile(middlewareFile);

    if (!writeResult.success) {
      this.mappings = [];
    }

    return writeResult;
  }

  private getMiddlewareName (filePath: string) {
    return path.basename(filePath).replace('.js', '').replace('.ts', '');
  }

  private async writeMiddlewareFile (middlewareFile: string) {
    const mkdirResult = await makeDirectory(path.dirname(this.outputPath));

    if (!mkdirResult.success) {
      console.error('Failed to make directory: ', mkdirResult.error);
      return {
        success: false
      };
    }

    const writeResult = await writeFile(this.outputPath, middlewareFile);
      
    if (!writeResult.success) {
      console.error('Failed to write middleware file: ', writeResult.error);
      return {
        success: false
      };
    }

    return {
      success: true
    };
  }
}