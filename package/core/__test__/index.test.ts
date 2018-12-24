import AwesomeI18n from '../lib/index';
import MemoryFileSystem = require('memory-fs');

test('normal', async () => {
  const mfs = new MemoryFileSystem();

  mfs.writeFileSync('/a.js', `<div>{__('中文a')}</div>`, 'utf-8');
  mfs.writeFileSync('/b.js', `<div>{__define('111')}</div>`, 'utf-8');
  mfs.writeFileSync('/c.tsx', `<div>{__define('中文c')}</div>`, 'utf-8');

  mfs.mkdirSync('/i18n');
  mfs.writeFileSync('/i18n/zh-cn.json', JSON.stringify({ 中文c: '中文c的翻译' }), 'utf-8');

  const i18n = new class extends AwesomeI18n {
    getInputFiles() {
      return ['/a.js', '/b.js', '/c.tsx'];
    }
    getFs() {
      return mfs as any;
    }
  }({
    output: '/i18n',
    translator: (text, opt) => Promise.resolve({ message: [opt.to, text, opt.to].join('_') }),
  });
  const result = await i18n.run();
  expect(result).toEqual({
    en: { 中文a: 'en_中文a_en', '111': 'en_111_en', 中文c: 'en_中文c_en' },
    'zh-cn': { 中文a: '中文a', '111': '111', 中文c: '中文c的翻译' },
  });
});

test('自定义输出', async () => {
  const mfs = new MemoryFileSystem();

  mfs.writeFileSync('/a.js', `<div>{__('中文a')}</div>`, 'utf-8');

  mfs.mkdirSync('/i18n');

  const i18n = new class extends AwesomeI18n {
    getInputFiles() {
      return ['/a.js'];
    }
    getFs() {
      return mfs as any;
    }
  }({
    langs: ['zh-cn'],
    output: '/i18n',
    translator: (text) => Promise.resolve({ message: text }),
    generator: async ({ lang, result }) => {
      expect(lang).toEqual('zh-cn');
      expect(result);
      return {
        filePath: 'zh-cn.js',
        content: 'x'
      }
    }
  });
  await i18n.run();
  expect(mfs.existsSync('/i18n/zh-cn.json')).toBeTruthy();
  expect(mfs.existsSync('/i18n/zh-cn.js')).toBeTruthy();
  expect(mfs.readFileSync('/i18n/zh-cn.js', 'utf-8')).toEqual('x');
});