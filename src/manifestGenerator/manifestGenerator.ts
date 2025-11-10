import * as fs from 'fs';
import * as path from 'path';
import { Config, File, HttpMethod } from './types.js';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import * as t from '@babel/types';
import _traverse from '@babel/traverse';
import { readFile } from '../fileHelpers.js';
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
    if (!fs.existsSync(this.baseDir)) return { endpoints: [] };

    const entries = fs.readdirSync(this.baseDir);
    const mappedEntries: File[] = [];

    for (const entry of entries) { 
      mappedEntries.push(...await this.mapEntry(entry, this.baseDir));
    }

    return { endpoints: mappedEntries };
  }

  async mapEntryOrig (entry: string, currentPath: string, url: string = '') : Promise<File[]> {
    const fullPath = path.join(currentPath, entry);
    const stats = fs.statSync(fullPath);
    const newUrl = `${url}/${entry}`;

    const files: File[] = [];

    if (stats.isDirectory()) {
      const subEntries = fs.readdirSync(fullPath);
      for (const e of subEntries) {
        files.push(...await this.mapEntry(e, fullPath, newUrl));
      }
    } else {
      const endpointResult = await this.parseEndpointFile(fullPath);
    
      if (endpointResult.success) {
        files.push({
          name: entry,
          route: this.cleanUrl(newUrl),
          path: fullPath.replace(/\\/g, '/'),
          config: endpointResult.endpoint.config
        });
      }
    }

    return files;
  }

  async mapEntry (entry: string, currentPath: string, url: string = '') : Promise<File[]> {
    const fullPath = path.join(currentPath, entry);
    const stats = fs.statSync(fullPath);
    const newUrl = `${url}/${entry}`;

    if (stats.isDirectory()) {
      const subEntries = fs.readdirSync(fullPath);
      const results = await Promise.all(subEntries.map(e => this.mapEntry(e, fullPath, newUrl)));
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

  async parseEndpointFile (filePath: string): Promise<ParseEndpointResult> {
    const fileReadResult = await readFile(filePath);

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
    if (configNode) {
      try {
        const cfg = eval('(' + generate(configNode).code + ')') as Partial<Config>;
        return {
          httpMethod: cfg.httpMethod ?? HttpMethod.GET,
          middleware: cfg.middleware ?? [],
          handlerName: handlerName,
          isHandlerDefaultExport
        };
      } catch (error) {
        console.error(`failed to evaluate config, using endpoint defaults: ${error}`);
        return {
          httpMethod: HttpMethod.GET,
          middleware: [],
          handlerName: handlerName,
          isHandlerDefaultExport
        };
      }
    } else {
      return {
        httpMethod: HttpMethod.GET,
        middleware: [],
        handlerName: handlerName,
        isHandlerDefaultExport
      };
    }
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