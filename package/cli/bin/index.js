#!/usr/bin/env node

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

      let runI18n;
      
      // 配置是 array
      if (Array.isArray(config)) {
        runI18n = async () => {
          const re = [];
          for (const conf of config) {
            const result = await new AI18n(conf, hook).run();
            re.push(result);
          }
          return re;
        }
      } 
      // 配置是 object
      else {
        runI18n = async () => {
          const result = await new AI18n(config, hook).run();
          return [result];
        }
      }

      runI18n().then(translateResultList => {
        const resLength = translateResultList.length;
        translateResultList.forEach((translateResult, index) => {
          const firstLang = Object.keys(translateResult)[0];
          const cnt = Object.keys(translateResult[firstLang]).length;
          console.log('[%s/%s] 已执行完成 %s 个文案', index + 1, resLength, cnt);
        })
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
