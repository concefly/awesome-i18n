import AwesomeI18n from '../lib/index';
import MemoryFileSystem = require('memory-fs');
import { BaseTranslator, ITranslateOpt } from 'ai18n-type';

const defaultConfig = {
  input: '.',
  output: './i18n',
  defaultLang: 'zh-cn',
  langs: ['zh-cn', 'en'],
  logger: null,
  loader: [
    {
      test: '\\.tsx?$',
      use: 'ai18n-loader-ts',
    },
    {
      test: '\\.jsx?$',
      use: 'ai18n-loader-ts',
    },
  ],
  reducer: 'ai18n-reducer',
  translator: 'ai18n-translator-google',
};

class FakeTranslator extends BaseTranslator {
  async translate(text: string, opt: ITranslateOpt) {
    return { message: `${text}_${opt.from}_${opt.to}` };
  }
}

test('normal', async () => {
  const mfs = new MemoryFileSystem();

  mfs.writeFileSync('/a.js', `<div>{__('苹果')}</div>`, 'utf-8');
  mfs.writeFileSync('/b.js', `<div>{__define('香蕉')}</div>`, 'utf-8');
  mfs.writeFileSync('/c.tsx', `<div>{__define('西瓜')}</div>`, 'utf-8');

  mfs.mkdirSync('/i18n');
  mfs.writeFileSync('/i18n/en.json', JSON.stringify({ 苹果: 'apple' }), 'utf-8');

  const i18n = new (class extends AwesomeI18n {
    getInputFiles() {
      return ['/a.js', '/b.js', '/c.tsx'];
    }
    getFs() {
      return mfs as any;
    }
  })({
    ...defaultConfig,
    output: '/i18n',
    translator: new FakeTranslator(),
  });
  const result = await i18n.run();
  expect(result).toMatchSnapshot();
});

test('自定义输出 js', async () => {
  const mfs = new MemoryFileSystem();

  mfs.writeFileSync('/a.js', `<div>{__('中文a')}</div>`, 'utf-8');

  mfs.mkdirSync('/i18n');

  const i18n = new (class extends AwesomeI18n {
    getInputFiles() {
      return ['/a.js'];
    }
    getFs() {
      return mfs as any;
    }
  })({
    ...defaultConfig,
    langs: ['zh-cn'],
    output: '/i18n',
    translator: new FakeTranslator(),
    generator: async ({ lang, result }) => {
      expect(lang).toEqual('zh-cn');
      expect(result);
      return {
        filePath: 'zh-cn.js',
        content: `module.export = ${JSON.stringify(result, null, 2)}`,
      };
    },
  });
  await i18n.run();

  ['/i18n/zh-cn.json', '/i18n/zh-cn.js'].forEach(filePath => {
    expect(mfs.readFileSync(filePath, 'utf-8')).toMatchSnapshot(filePath);
  });
});
