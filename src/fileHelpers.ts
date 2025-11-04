import * as fs from 'fs';

type FileWriterResult = FileWriterSuccess | FileWriterFailure;

type FileWriterSuccess = {
  success: true;
}

type FileWriterFailure = {
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
      error: String(err)
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
      error: String(err)
    };
  }
}