import { File } from './types.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { ControllerManifest, createManifest } from './manifestGenerator.js';

export default async function generateEndpoints (sourceDirectory: string, outputPath: string) {
  const manifest: ControllerManifest = await createManifest(sourceDirectory);

  if (manifest.endpoints.length == 0) {
    console.error(`No endpoints found to map for ${sourceDirectory}`);
    return;
  }

  const routerDefinitions = manifest.endpoints.map(getRouterDefinition)
    .join(';\n') + ';';

  const gen = `import express from 'express';
${manifest.endpoints.map(e => mapHandlerImport(e, outputPath)).join('\n')}

const router = express.Router();

${routerDefinitions}

export default router;
    `;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, gen, 'utf8');
  console.log(`generated endpoints: ${outputPath}`);
}
  
function getRouterDefinition (endpoint: File): string {
  return `router.${endpoint.config.httpMethod.toLowerCase()}('${endpoint.route}', ${endpoint.config.handlerName})`;
}

function mapHandlerImport (endpoint: File, outputPath: string) {
  const routerDir = path.dirname(outputPath);
  const handlerPath = path.resolve(endpoint.path);

  let relativePath = path.relative(routerDir, handlerPath).replace(/\\/g, '/');

  if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

  if (endpoint.config.isHandlerDefaultExport) {
    return `import ${endpoint.config.handlerName} from '${relativePath}'`;
  } else {
    return `import {handler as ${endpoint.config.handlerName}} from '${relativePath}'`;
  }
}

