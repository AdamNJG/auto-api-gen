
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

export type GenerateEndpointsResults = {
  success: boolean;
}