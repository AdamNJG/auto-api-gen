import { File } from '../manifestGenerator/types.js';
import { GenerateEndpointsResults } from './types.js';
import * as path from 'path';
import { ControllerManifest, createManifest } from '../manifestGenerator/manifestGenerator.js';
import { makeDirectory, writeFile } from '../fileHelpers.js';

export default async function generateEndpoints (sourceDirectory: string, outputPath: string) : Promise<GenerateEndpointsResults> {
  const manifest: ControllerManifest = await createManifest(sourceDirectory, 'handler');

  if (manifest.endpoints.length == 0) {
    console.error(`No endpoints found to map for ${sourceDirectory}`);
    return {
      success: false
    };
  }

  const routerDefinitions = manifest.endpoints.map(getRouterDefinition)
    .join(';\n') + ';';

  const gen = `import express from 'express';
${manifest.endpoints.map(e => mapHandlerImport(e, outputPath)).join('\n')}

const router = express.Router();

${routerDefinitions}

export default router;
    `;

  const dirResult = await makeDirectory(path.dirname(outputPath));

  if (!dirResult.success) {
    console.error(`Error creating the directory: ${path.dirname(outputPath)}: `, dirResult.error);
    return {
      success: false
    };
  }

  const writeResult = await writeFile(outputPath, gen);
  if (!writeResult.success) {
    console.error(`Error writing the file: ${outputPath}: `, writeResult.error);
    return {
      success: false
    };
  }

  return {
    success: true
  };
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
    return `import ${endpoint.config.handlerName} from '${relativePath}';`;
  } else {
    return `import { handler as ${endpoint.config.handlerName} } from '${relativePath}';`;
  }
}

