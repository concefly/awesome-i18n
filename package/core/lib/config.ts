import {
  BaseTranslator,
  LoadResult,
  ReduceResult,
  BaseLog,
  TranslateCtx,
  ExtractResult,
  ILocalizeMsgMap,
} from 'ai18n-type';

export interface IConfig {
  /** 输入文件 glob */
  input: string;
  ignore?: string[];

  /** 输出目录 */
  output: string;

  /** 翻译语言列表 */
  langs: string[];
  loader: { test: RegExp | string; use: string }[];
  reducer: string;
  translator: string | BaseTranslator;

  logger?: typeof BaseLog | null;

  hook?: {
    beforeLoad?: (filePath: string) => void;
    afterLoad?: (filePath: string, result: any) => void;
    afterLoadAll?: (result: LoadResult) => void;
    afterTranslate?: (result: TranslateCtx) => void;
    afterReduce?: (
      result: ReduceResult,
      extra: {
        /** 代码提取结果 */
        extractResult: ExtractResult;

        /** 从本地读取的多语言 json */
        localMsgJson: ILocalizeMsgMap;
      }
    ) => void;
  };
}
