export interface LoaderConstructor {
  new (config?): LoaderInstance;
}

export interface LoaderInstance {
  parse: (
    code: string,
    filePath: string,
  ) => {
    mark: {
      key: string;
      description?: string;
    };
  }[];
}
