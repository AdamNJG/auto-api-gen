export type File = {
  name: string;
  route: string;
  path: string;
  handler: string;
  config: Config;
}

export type Config = {
  httpMethod: HttpMethod;
  middleware: string[];
  handlerName: string;
  isHandlerDefaultExport: boolean;
}

export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
  OPTIONS = 'options',
  HEAD = 'head'
}