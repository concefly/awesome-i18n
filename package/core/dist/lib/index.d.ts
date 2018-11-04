/// <reference types="node" />
import * as fs from 'fs';
import { ConfigType } from './config';
import { ReduceResultType } from '../type/reducer';
import { TranslatorFuncType } from '../type/translator';
export interface OptType {
    hook?: {
        beforeLoad?: (filePath: string) => void;
        afterLoad?: (filePath: string, result: any) => void;
        afterLoadAll?: (result: any) => void;
        afterTranslate?: (src: string, result: string, from: string, to: string) => void;
    };
}
export default class AwesomeI18n {
    config: ConfigType;
    opt: OptType;
    constructor(config?: Partial<ConfigType>, opt?: OptType);
    getFs(): typeof fs;
    getInputFiles(): string[];
    readFile(filePath: any): string;
    getDumpFilePath(lang: string): string;
    getTranslator(): TranslatorFuncType;
    /**
     * 翻译到指定语言
     */
    translate(reduceResult: ReduceResultType, lang: string): Promise<{
        [key: string]: string;
    }>;
    /**
     * 导出多语言文件
     */
    dump(result: {
        [key: string]: string;
    }, lang: string): void;
    run(): Promise<{
        [lang: string]: {
            [key: string]: string;
        };
    }>;
}
