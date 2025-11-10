import * as path from 'path';
import { Config, File, HttpMethod } from './types.js';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import * as t from '@babel/types';
import _traverse from '@babel/traverse';
import { exists, readDirectory, readFileSync, stat } from '../fileHelpers.js';
const traverse =  typeof _traverse === 'function' ? _traverse : _traverse.default;

export type ControllerManifest = {
  endpoints: File[];
};

type ParsedEndpoint = {
  config: Config;
}

type ParseEndpointResult = {
  success: true;
  endpoint: ParsedEndpoint
} | { success: false; }

export default class ManifestGenerator { 
  private baseDir: string;
  private defaultHandlerName: string;
  
  constructor (baseDir: string, defaultHandlerName = 'handler') {
    this.baseDir = baseDir;
    this.defaultHandlerName = defaultHandlerName;
  }

  async createManifest (): Promise<ControllerManifest> {
    console.log(this.defaultHandlerName);
    if (!exists(this.baseDir)) return { endpoints: [] };

    const directoryResult = await readDirectory(this.baseDir);

    if (!directoryResult.success) {
      console.error('Error reading handler directory: ', directoryResult.error);
      return {
        endpoints: []
      };
    }

    const mappedEntries: File[] = [];

    for (const entry of directoryResult.content) { 
      mappedEntries.push(...await this.mapEntry(entry, this.baseDir));
    }

    return { endpoints: mappedEntries };
  }

  async mapEntry (entry: string, currentPath: string, url: string = '') : Promise<File[]> {
    const fullPath = path.join(currentPath, entry);
    const statResult = stat(fullPath);

    if (!statResult.success) {
      console.error(`Couldn't get info for file: ${fullPath}: `, statResult.error);
      return [];
    }

    const newUrl = `${url}/${entry}`;

    if (statResult.content.isDirectory()) {
      const entriesResult = await readDirectory(fullPath);

      if (!entriesResult.success) {
        console.error(`Couldn't read directory: ${fullPath}: `, entriesResult.error);
        return [];
      }
      const results = await Promise.all(entriesResult.content.map(e => this.mapEntry(e, fullPath, newUrl)));
      return results.flat();
    } 

    const endpointResult = await this.parseEndpointFile(fullPath);
    if (!endpointResult.success) return [];

    return [{
      name: entry,
      route: this.cleanUrl(newUrl),
      path: fullPath.replace(/\\/g, '/'),
      config: endpointResult.endpoint.config
    }];
  }

  cleanUrl (url: string): string {
    let cleanUrl =  url
      .replace(/\[/g, ':')
      .replace(/\]/g, '')
      .replace('index.js', '')
      .replace('index.ts', '')
      .replace('.js', '')
      .replace('.ts', '');

    if (cleanUrl !== '/' && cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl;
  }

  parseEndpointFile (filePath: string): ParseEndpointResult {
    const fileReadResult = readFileSync(filePath);

    if (!fileReadResult.success) {
      console.error(fileReadResult.error);
      return { success: false };
    }

    let ast;
    try {
      ast = parse(fileReadResult.content, { sourceType: 'module', plugins: ['typescript'] });
    } catch (error) {
      console.error(`Failed to parse ${filePath}: ${error}`);
      return { success: false };
    }

    let handlerNode: t.FunctionDeclaration | null = null;
    let configNode: t.ObjectExpression | null = null;
    let isDefaultExport: boolean = false;

    const handlerName = this.defaultHandlerName;
    traverse(ast, {
      ExportNamedDeclaration (path) {
        if (path.node.declaration?.type === 'FunctionDeclaration' &&
          path.node.declaration.id?.name === handlerName) {
          handlerNode = path.node.declaration;
        }
        if (path.node.declaration?.type === 'VariableDeclaration') {
          const decl = path.node.declaration.declarations[0];
          if (t.isIdentifier(decl.id) && decl.id.name === 'config') {
            configNode = decl.init as t.ObjectExpression;
          }
        }
      },
      ExportDefaultDeclaration (path) {
        if (path.node.declaration?.type === 'FunctionDeclaration' &&
          path.node.declaration.id?.name === handlerName) {
          handlerNode = path.node.declaration;
          isDefaultExport = true;
        }
      }
    });

    if (!handlerNode) return {
      success: false
    };

    return {
      success: true,
      endpoint: {
        config: this.parseConfig(configNode, this.getFunctionName(filePath), isDefaultExport)
      }
    };
  }

  parseConfig (configNode: t.ObjectExpression | null, handlerName: string, isHandlerDefaultExport: boolean) : Config {
    let cfg: Partial<Config> = {};

    if (configNode) {
      try {
        cfg = eval('(' + generate(configNode).code + ')') as Partial<Config>;
      } catch (error) {
        console.error(`Failed to evaluate config, using endpoint defaults: ${error}`);
      }
    }

    return {
      httpMethod: cfg?.httpMethod ?? HttpMethod.GET,
      middleware: cfg?.middleware ?? [],
      handlerName,
      isHandlerDefaultExport
    };
  }

  getFunctionName (filePath: string) : string {
    const parts = path
      .relative(this.baseDir, filePath)
      .split(path.sep);                  

    return parts
      .join('_')                         
      .replace(/\[|\]/g, '')
      .replace(/[^a-zA-Z0-9_$]/g, '_')    
      .replace(/^(\d)/, '_$1')
      .replace(/_ts$/, '')
      .replace(/_js$/, '');
  }
}