import * as ts from 'typescript';
export interface LoaderConfigType {
}
export interface LoaderParseType {
    mark: {
        key: string;
        description?: string;
    };
}
declare class Loader {
    config: LoaderConfigType;
    ast: ts.SourceFile;
    constructor(config?: LoaderConfigType);
    private parseCallExpression;
    parse(code: string, filePath: string): LoaderParseType[];
}
export default Loader;
