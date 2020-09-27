import { BaseTranslator, ILocalizeMsgMap, LoadResult, ReduceResult, BaseLog } from 'ai18n-type';

export interface IConfig {
  /** 输入文件 glob */
  input: string;
  ignore?: string[];

  /** 输出目录 */
  output: string;

  /** 源码语言 */
  defaultLang: string;

  /** 翻译语言列表 */
  langs: string[];
  loader: { test: RegExp | string; use: string }[];
  reducer: string;
  translator: string | BaseTranslator;

  /** 自定义输出 */
  generator?: (props: {
    lang: string;
    result: ILocalizeMsgMap;
  }) => Promise<{
    filePath: string;
    content: string;
  }>;

  logger?: typeof BaseLog | null;

  hook?: {
    beforeLoad?: (filePath: string) => void;
    afterLoad?: (filePath: string, result: any) => void;
    afterLoadAll?: (result: LoadResult) => void;
    afterTranslate?: (src: string, result: string, from: string, to: string) => void;
    afterReduce?: (result: ReduceResult) => void;
  };
}
