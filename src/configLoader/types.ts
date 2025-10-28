export type AutoApiConfig = {
  api_folders: ApiFolder[];
  port: number;
  bootstrapDom?: boolean
}

type ApiFolder = {
  directory: string;
  api_slug: string;
}