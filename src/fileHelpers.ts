import * as fs from 'fs';

type FileWriterResult = FileWriterSuccess | FileHelperFailure;
type FileReaderResult<T> = FileReaderSuccess<T> | FileHelperFailure;

type FileWriterSuccess = {
  success: true;
}

type FileReaderSuccess<T> = {
  success: true;
  content: T;
}

type FileHelperFailure = {
  success: false;
  error: string;
}

export async function makeDirectory (filePath: string, recursive: boolean = true) : Promise<FileWriterResult> {
  try {
    await fs.promises.mkdir(filePath, { recursive: recursive });
    return {
      success: true
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : String(err))
    };
  }
}

export async function writeFile (outputPath: string, contents: string) : Promise<FileWriterResult>  {
  try {
    await fs.promises.writeFile(outputPath, contents, 'utf8');
    return {
      success: true
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : String(err))
    };
  }
}

export async function readFile (filePath: string) : Promise<FileReaderResult<string>> {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return {
      success: true,
      content: content
    };
  } catch (err) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : String(err))
    };
  }
}

export function readFileSync (filePath: string) : FileReaderResult<string> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      success: true,
      content: content
    };
  } catch (err) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : String(err))
    };
  }
}

export function exists (filePath: string) : boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

export async function readDirectory (filePath: string): Promise<FileReaderResult<string[]>> {
  try {
    const results = await fs.promises.readdir(filePath);
    return {
      success: true,
      content: results
    };
  } catch (err) { 
    return {
      success: false,
      error: (err instanceof Error ? err.message : String(err))
    };
  }
}

export function stat (path: string): FileReaderResult<fs.Stats> {
  try {
    const stats = fs.statSync(path);
    return {
      success: true,
      content: stats
    };
  } catch (err) {
    return {
      success: false,
      error: (err instanceof Error ? err.message : String(err))
    };
  }
}