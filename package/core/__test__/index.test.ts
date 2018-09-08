import AwesomeI18n from '../lib/index';

test('normal', async () => {
  const i18n = new class extends AwesomeI18n {
    getInputFiles() {
      return ['a.js', 'b.js'];
    }
    readFile(filePath) {
      switch (filePath) {
        case 'a.js':
          return `<div>{__('中文a')}</div>`;
        case 'b.js':
          return `<div>{__define('中文b')}</div>`;
      }
    }
    dump() {}
  }({
    translator: (text, opt) => Promise.resolve({ message: [opt.to, text, opt.to].join('_') }),
  });
  const result = await i18n.run();
  expect(result).toEqual({
    en: { 中文a: 'en_中文a_en', 中文b: 'en_中文b_en' },
    'zh-cn': { 中文a: '中文a', 中文b: '中文b' },
  });
});
