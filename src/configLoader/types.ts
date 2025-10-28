export type AutoApiConfig = {
  api_folders: ApiFolder[];
  port: number;
}

type ApiFolder = {
  directory: string;
  api_slug: string;
}