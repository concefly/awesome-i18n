import { TranslatorFuncType } from '../type/translator';
export interface ConfigType {
    /** 输入文件 glob */
    input: string;
    /** 输出目录 */
    output: string;
    /** 源码语言 */
    defaultLang: string;
    /** 翻译语言列表 */
    langs: string[];
    loader: {
        test: RegExp;
        use: string;
    }[];
    reducer: string;
    translator: string | TranslatorFuncType | [string, any];
}
export declare function getDefaultConfig(): ConfigType;
