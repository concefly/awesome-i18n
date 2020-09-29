import { BaseTranslator, TranslateCtx } from 'ai18n-type';
import * as fs from 'fs';
import * as prompts from 'prompts';

export default class ManualTranslator extends BaseTranslator {
  async translate(ctx: TranslateCtx) {
    const filename = 'translate-manual.txt';

    let msg = '';
    const mappers: Map<string, string>[] = [];

    ctx.list.forEach(d => {
      msg += d.uglify.text + '\n';
      mappers.push(d.uglify.mapper);
    });

    fs.writeFileSync(filename, msg, { encoding: 'utf-8' });

    const answer = await prompts({
      type: 'text',
      name: 'value',
      message: `已生成 ${filename}, 将此文件复制到翻译引擎处理，然后将翻译结果回填覆盖。按 y 继续。`,
    });

    if (answer.value !== 'y') return;

    const content = fs.readFileSync(filename, { encoding: 'utf-8' });
    fs.unlinkSync(filename);

    content.split('\n').forEach((message, i) => {
      const mapper = mappers[i];
      if (!mapper) return;

      for (const [marker, nonCnStr] of mapper.entries()) {
        message = message.replace(marker, nonCnStr);
      }

      ctx.list[i].result = { message };
    });
  }
}
