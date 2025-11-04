export type AutoApiConfig = {
    api_folders: ApiFolder[];
    port: number;
    middleware_folder?: string;
    app_middleware?: string[];
    rollupExternals?: string[];
};
type ApiFolder = {
    directory: string;
    api_slug: string;
};
export {};
