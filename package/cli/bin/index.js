const yargs = require('yargs');
const AI18n = require('ai18n-core').default;
const { getUserConfig } = require('./config');

const hook = {
  afterLoadAll: (parseResult) => console.log(`${parseResult.length} texts have been loaded.`),
  afterTranslate: (src, result) => console.log(`${src} -> ${result}`),
};

yargs
  .command(
    'all',
    '全流程执行 i18n',
    yargs => {},
    argv => {
      const config = getUserConfig(argv.config);
      const i18n = new AI18n(config, { hook });
      i18n.run().then(translateResult => {
        const firstLang = Object.keys(translateResult)[0];
        const cnt = Object.keys(translateResult[firstLang]).length;
        console.log('已执行完成 %s 个文案', cnt);
      });
    }
  )
  .option('verbose', {
    alias: 'v',
    default: false,
  })
  .option('config', {
    default: './i18nrc.js',
  }).argv;
