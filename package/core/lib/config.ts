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
  translator: string | TranslatorFuncType;
}

export function getDefaultConfig(): ConfigType {
  return {
    input: '.',
    output: './i18n',
    defaultLang: 'zh-cn',
    langs: ['zh-cn', 'en'],
    loader: [
      {
        test: /\.js$/,
        use: 'awesome-i18n-loader-js',
      },
    ],
    reducer: 'awesome-i18n-reducer-icu',
    translator: 'awesome-i18n-translator-google',
  };
}
