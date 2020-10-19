import { TranslateCtx, TranslateItem } from 'ai18n-type';
import ManualTranslator from '../lib';

class MockManualTranslator extends ManualTranslator {
  answerList: any[] = [];
  fileData = new Map<string, string>();

  protected answerIndex = 0;
  protected prompts = (async () => {
    return this.answerList[this.answerIndex++];
  }) as any;

  protected fs = {
    writeFileSync: (path: string, data: any) => this.fileData.set(path, data),
    readFileSync: (path: string) => this.fileData.get(path),
    unlinkSync: (path: string) => this.fileData.delete(path),
  } as any;
}

const createCtx = () => {
  return new TranslateCtx([
    new TranslateItem('苹果', 'zh-cn', 'en'),
    new TranslateItem('香蕉', 'zh-cn', 'en'),
  ]);
};

const inspectCtx = (ctx: TranslateCtx) => {
  return ctx;
};

describe('ManualTranslator', () => {
  it('translateManual', async () => {
    const trans = new MockManualTranslator();
    trans.answerList = [{ transType: 'manual' }, { message: 'apple' }, { message: 'banana' }];

    const ctx = createCtx();
    await trans.translate(ctx);

    expect(inspectCtx(ctx)).toMatchSnapshot();
  });

  it('translatePlatform', async () => {
    const trans = new MockManualTranslator();
    trans.answerList = [{ transType: 'platform' }, { confirm: true }];

    const ctx = createCtx();
    await trans.translate(ctx);

    expect(trans.fileData.has('translate-manual.txt')).toBeFalsy();
    expect(inspectCtx(ctx)).toMatchSnapshot();
  });
});
