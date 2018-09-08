export interface LoaderConstructor {
  new (config?): LoaderInstance;
}

export interface LoaderInstance {
  parse: (
    code: string
  ) => {
    mark: {
      key: string;
      description?: string;
    };
  }[];
}
