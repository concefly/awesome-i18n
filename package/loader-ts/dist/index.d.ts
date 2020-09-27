import { LoadResult, BaseLoader } from 'ai18n-type';
export default class Loader extends BaseLoader {
    /** 解析函数表达式 */
    private parseCallExpression;
    parse(code: string, filePath: string): LoadResult;
}
