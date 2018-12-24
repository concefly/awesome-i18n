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
  loader: { test: RegExp; use: string }[];
  reducer: string;
  translator: string | TranslatorFuncType | [string, any];

  /** 自定义输出 */
  generator?: (props: { lang: string, result: { [key: string]: string } }) => Promise<{
    filePath: string,
    content: string
  }>;
}

export function getDefaultConfig(): ConfigType {
  return {
    input: '.',
    output: './i18n',
    defaultLang: 'zh-cn',
    langs: ['zh-cn', 'en'],
    loader: [
      {
        test: /\.jsx?$/,
        use: 'ai18n-loader-js',
      },
      {
        test: /\.tsx?$/,
        use: 'ai18n-loader-ts',
      },
    ],
    reducer: 'ai18n-reducer',
    translator: 'ai18n-translator-google',
  };
}
