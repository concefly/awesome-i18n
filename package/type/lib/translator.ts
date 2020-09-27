export interface ITranslateOpt {
  from: string;
  to: string;
}

export abstract class BaseTranslator {
  /** 并发请求数 */
  parallel?: number;

  abstract translate(text: string, opt: ITranslateOpt): Promise<{ message: string }>;
}

export interface IBaseTranslator extends BaseTranslator {
  new (): BaseTranslator;
}
