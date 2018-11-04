export interface LoaderConstructor {
    new (config?: any): LoaderInstance;
}
export interface LoaderInstance {
    parse: (code: string, filePath: string) => {
        mark: {
            key: string;
            description?: string;
        };
    }[];
}
