export interface ReduceSourceType {
    key: string;
    description?: string;
    message?: string;
}
export interface ReduceResultType {
    [key: string]: {
        message: string;
        /** 待翻译的关键字列表 */
        keywords: string[];
    };
}
export interface ReducerConstructor {
    new (config?: any): ReducerInstance;
}
export interface ReducerInstance {
    extract(raw: {
        [key: string]: string;
    }): ReduceSourceType[];
    reduce(incoming: ReduceSourceType[], src: ReduceSourceType[]): ReduceResultType;
}
