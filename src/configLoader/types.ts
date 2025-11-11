export type AutoApiConfig = {
  api_folders: ApiFolder[];
  port: number;
  middleware_folder?: string;
  app_middleware?: string[];
  rollupExternals?: string[];
  pre_run_scripts?: string;
  static_assets?: StaticAssets;
}

type ApiFolder = {
  directory: string;
  route_section: string;
  middleware?: string[];
}

type StaticAssets = {
  directory: string;
  route_section: string;
}