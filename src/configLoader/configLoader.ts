import * as path from 'path';
import * as fs from 'fs';
import { AutoApiConfig } from './types.js';
import ts from 'typescript';
import { pathToFileURL } from 'url';

export async function loadConfig (configOverride: string | undefined = undefined): Promise<AutoApiConfig | undefined> {
  const candidates = ['ts', 'js', 'json', 'cjs', 'mjs'];
  const projectRoot = configOverride ?? process.cwd();

  for (const extension of candidates) {

    const filePath = path.join(projectRoot, 'autoapi.config.' + extension);
    if (fs.existsSync(filePath)) {

      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
      case '.json':
      {
        const json = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(json) as AutoApiConfig;
      }
      case '.js':
      case '.cjs':
      case '.mjs':
        return await importJsConfig(filePath);
      case '.ts':
        return importTsConfig(filePath);
      }
    }
  }
  return undefined;
}

async function importJsConfig (filePath: string): Promise<AutoApiConfig> {
  const fileUrl = pathToFileURL(filePath).href;
  const mod = await import(fileUrl);

  const config: AutoApiConfig =
  (mod as any).config ??  
  (mod as any).default ?? 
  (mod as any);            

  return config;
}

async function importTsConfig (filePath: string): Promise<AutoApiConfig> {
  const tsCode = fs.readFileSync(filePath, 'utf8');

  const jsCode = ts.transpileModule(tsCode, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    }
  }).outputText;

  const tempFile = path.join(path.dirname(filePath), '__temp_config__.mjs');
  fs.writeFileSync(tempFile, jsCode, 'utf8');

  try {
    const mod = await import(pathToFileURL(tempFile).href);
    return (mod as any).config ?? (mod as any).default ?? (mod as any);
  } finally {
    fs.unlinkSync(tempFile);
  }
}