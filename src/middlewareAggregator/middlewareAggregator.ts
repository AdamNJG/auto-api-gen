import { createManifest } from '../manifestGenerator/manifestGenerator.js';
import { File } from '../manifestGenerator/types.js';
import path from 'path';
import * as fs from 'fs';

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

export default async function aggregateMiddleware (sourceDirectory: string, outputPath: string) : Promise<GenerateMiddlewareResult> {
  const manifest = await createManifest(sourceDirectory, 'middleware');

  if (manifest.endpoints.length === 0) {
    console.error(`No middleware found in folder: ${sourceDirectory}`);
    return {
      success: false
    };
  }

  const mappings: MiddlewareMappingInfo[] = [];

  for (const file of manifest.endpoints) { 
    mappings.push({
      middleWareName: getMiddlewareName(file.path),
      mappedFunctionName: file.config.handlerName,
      import: mapMiddlewareImport(file, outputPath)
    });
  }

  return await generateMiddlewareFile(mappings, outputPath);
}

function mapMiddlewareImport (endpoint: File, outputPath: string) {
  const routerDir = path.dirname(outputPath);
  const handlerPath = path.resolve(endpoint.path);

  let relativePath = path.relative(routerDir, handlerPath).replace(/\\/g, '/');

  if (!relativePath.startsWith('.')) relativePath = './' + relativePath;

  if (endpoint.config.isHandlerDefaultExport) {
    return `import ${endpoint.config.handlerName} from '${relativePath.replace('.ts','.js')}'`;
  } else {
    return `import { handler as ${endpoint.config.handlerName} } from '${relativePath.replace('.ts','.js')}'`;
  }
}

async function generateMiddlewareFile (mappings: MiddlewareMappingInfo[], outputPath: string) : Promise<GenerateMiddlewareResult> {
  const middlewareFile = 
  `${mappings.map(m => `${m.import};`).join('\n')}
  
const middleware = {
${mappings.map(m => `  '${m.middleWareName}': ${m.mappedFunctionName}`).join(',\n')}
};

export default middleware;
  `;
  try {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, middlewareFile, 'utf8');
    return {
      success: true
    };
  } catch (err) {
    console.error('Failure writing middleware aggregation: ', err); 

    return {
      success: false
    };
  }
}

function getMiddlewareName (filePath: string) {
  return path.basename(filePath).replace('.js', '').replace('.ts', '');
}