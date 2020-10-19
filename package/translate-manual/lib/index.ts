import { BaseTranslator, TranslateCtx } from 'ai18n-type';
import * as _fs from 'fs';
import * as _prompts from 'prompts';

export default class ManualTranslator extends BaseTranslator {
  // for test mock
  protected prompts = _prompts;
  protected fs = _fs;

  /** 平台翻译 */
  protected async translatePlatform(ctx: TranslateCtx) {
    let msg = '';
    const filename = 'translate-manual.txt';
    const mappers: Map<string, string>[] = [];

    ctx.list.forEach(d => {
      msg += d.uglify.text + '\n';
      mappers.push(d.uglify.mapper);
    });

    this.fs.writeFileSync(filename, msg, { encoding: 'utf-8' });

    const answer = await this.prompts({
      type: 'confirm',
      name: 'confirm',
      message: `已生成 ${filename}, 将此文件复制到翻译引擎处理，然后将翻译结果回填覆盖。按 y 继续。`,
    });

    if (answer.confirm) {
      const content = this.fs.readFileSync(filename, { encoding: 'utf-8' });

      content.split('\n').forEach((message, i) => {
        const mapper = mappers[i];
        if (!mapper) return;

        for (const [marker, nonCnStr] of mapper.entries()) {
          message = message.replace(marker, nonCnStr);
        }

        ctx.list[i].result = { message };
      });
    }

    this.fs.unlinkSync(filename);
  }

  /** 手动翻译 */
  protected async translateManual(ctx: TranslateCtx) {
    for (const t of ctx.list) {
      const answer = await this.prompts({
        type: 'text',
        name: 'message',
        message: `[${t.from}->${t.to}] ${t.text}`,
      });

      t.result = { message: answer.message };
    }
  }

  async translate(ctx: TranslateCtx) {
    const s = await this.prompts({
      type: 'select',
      name: 'transType',
      message: `共 ${ctx.list.length} 个待翻译文案，请选择翻译方式`,
      choices: [
        { title: '手动', value: 'manual' },
        { title: '翻译平台', description: '由翻译平台处理', value: 'platform' },
      ],
    });

    if (s.transType === 'manual') return this.translateManual(ctx);
    else if (s.transType === 'platform') return this.translatePlatform(ctx);
  }
}
