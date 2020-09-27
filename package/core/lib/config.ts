import { BaseTranslator, ILocalizeMsgMap, LoadResult, ReduceResult } from 'ai18n-type';

export interface IConfig {
  /** 输入文件 glob */
  input: string;

  /** 输出目录 */
  output: string;

  /** 源码语言 */
  defaultLang: string;

  /** 翻译语言列表 */
  langs: string[];
  loader: { test: RegExp; use: string }[];
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

  hook?: {
    beforeLoad?: (filePath: string) => void;
    afterLoad?: (filePath: string, result: any) => void;
    afterLoadAll?: (result: LoadResult) => void;
    afterTranslate?: (src: string, result: string, from: string, to: string) => void;
    afterReduce?: (result: ReduceResult) => void;
  };
}

export function getDefaultConfig(): IConfig {
  return {
    input: '.',
    output: './i18n',
    defaultLang: 'zh-cn',
    langs: ['zh-cn', 'en'],
    loader: [
      {
        test: /\.tsx?$/,
        use: 'ai18n-loader-ts',
      },
      {
        test: /\.jsx?$/,
        use: 'ai18n-loader-ts',
      },
    ],
    reducer: 'ai18n-reducer',
    translator: 'ai18n-translator-google',
  };
}
