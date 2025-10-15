import * as fs from 'fs';
import * as path from 'path';
import { Config, File, HttpMethod } from './types.js';
import { parse } from '@babel/parser';
import { generate } from '@babel/generator';
import * as t from '@babel/types';
import _traverse from '@babel/traverse';
const traverse =  typeof _traverse === 'function' ? _traverse : _traverse.default;

export type ControllerManifest = {
  endpoints: File[];
};

type ParsedEndpoint = {
  handler: string;
  config: Config;
}

type ParseEndpointResult = {
  success: true;
  endpoint: ParsedEndpoint
} | { success: false; }

export async function createManifest (dirPath: string) : Promise<ControllerManifest> {
  if (!fs.existsSync(dirPath)) return {
    endpoints: []
  }; 
  
  const entries = fs.readdirSync(dirPath);
  const mappedEntries: File[] = [];

  for (const entry of entries) { 
    mappedEntries.push(...await mapEntry(entry, dirPath));
  }

  return {
    endpoints: mappedEntries
  };
}

async function mapEntry (entry: string, currentPath: string, url: string = '') : Promise<File[]> {
  const fullPath = path.join(currentPath, entry);
  const stats = fs.statSync(fullPath);

  const files: File[] = [];
  url = url + `/${entry}`;

  if (stats.isDirectory()) {
    const subEntries = fs.readdirSync(fullPath);
    for (const e of subEntries) {
      files.push(...await mapEntry(e, fullPath, url));
    }
  } else {
    const endpointResult = parseEndpointFile(fullPath);
    
    if (endpointResult.success) {
      files.push({
        name: entry,
        route: url.replace('index.js', '').replace('.js', ''),
        path: fullPath.replace(/\\/g, '/'),
        config: endpointResult.endpoint.config,
        handler: endpointResult.endpoint.handler
      });
    }
  }

  return files;
}

function parseEndpointFile (filePath: string): ParseEndpointResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  let ast;
  try {
    ast = parse(content, { sourceType: 'module', plugins: ['typescript'] });
  } catch (error) {
    console.error(`Failed to parse ${filePath}: ${error}`);
    return { success: false };
  }

  let handlerNode: t.FunctionDeclaration | null = null;
  let configNode: t.ObjectExpression | null = null;
  let isDefaultExport: boolean = false;

  traverse(ast, {
    ExportNamedDeclaration (path) {
      if (path.node.declaration?.type === 'FunctionDeclaration' &&
          path.node.declaration.id?.name === 'handler') {
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
          path.node.declaration.id?.name === 'handler') {
        handlerNode = path.node.declaration;
        isDefaultExport = true;
      }
    }
  });

  if (!handlerNode) return {
    success: false
  };

  const safeHandlerNode = handlerNode as t.FunctionDeclaration;

  const functionName = getFunctionName(filePath);
  safeHandlerNode.id!.name = functionName;

  return {
    success: true,
    endpoint: {
      handler: generate(safeHandlerNode).code,
      config: parseConfig(configNode, functionName, isDefaultExport)
    }
  };
}

function parseConfig (configNode: t.ObjectExpression | null, handlerName: string, isHandlerDefaultExport: boolean) : Config {
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
      console.error(`failed to evaluate config: ${error}`);
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

function getFunctionName (filePath: string) : string {
  const parts = path
    .relative(process.cwd(), filePath) 
    .split(path.sep);                   

  const relevantParts = parts.slice(-2); 

  return relevantParts
    .join('_')                          
    .replace(/[^a-zA-Z0-9_$]/g, '_')    
    .replace(/^(\d)/, '_$1'); 
}