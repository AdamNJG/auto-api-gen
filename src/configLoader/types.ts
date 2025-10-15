export type AutoApiConfig = {
  api_folders: ApiFolder[];
  endpointFolder: string;
  port: number;
}

type ApiFolder = {
  directory: string;
  api_slug: string;
}