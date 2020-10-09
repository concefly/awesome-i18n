import { cnRegCharList } from './const';

const notCnReg = new RegExp(`([^${cnRegCharList}]+)`, 'g');

export class TranslateItem {
  constructor(
    readonly text: string,
    readonly from: string,
    readonly to: string,
    /** 翻译结果 */
    public result?: { message: string }
  ) {}

  readonly uglify = this.getUglifyResult();

  private getUglifyResult() {
    let text = this.text;
    const mapper = new Map<string, string>();

    // 匹配非中文字符段
    const match = text.match(notCnReg);

    // 没有非中文部分，直接返回
    if (!match) return { text, mapper };

    match.forEach(nonCnStr => {
      for (let i = 0; i < 20; i++) {
        // 随机生成占位符(占位符用数字，翻译前后可保持不变)
        const marker = Math.floor(Math.random() * 10000) + '';
        if (text.includes(marker)) continue;

        // 替换非中文部分为占位符
        text = text.replace(nonCnStr, marker);
        mapper.set(marker, nonCnStr);
      }
    });

    return { text, mapper };
  }
}

/** 翻译上下文 */
export class TranslateCtx {
  constructor(readonly list: TranslateItem[] = []) {}
}

export abstract class BaseTranslator {
  abstract translate(ctx: TranslateCtx): Promise<void>;
}

export interface IBaseTranslator extends BaseTranslator {
  new (): BaseTranslator;
}
