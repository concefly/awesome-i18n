export interface ITranslateOpt {
  from: string;
  to: string;
}

export abstract class BaseTranslator {
  abstract translate(text: string, opt: ITranslateOpt): Promise<{ message: string }>;
}

export interface IBaseTranslator extends BaseTranslator {
  new (): BaseTranslator;
}
