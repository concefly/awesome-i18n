import * as glob from 'glob';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigType, getDefaultConfig } from './config';
import { LoaderConstructor } from '../type/loader';
import { ReducerConstructor, ReduceResultType } from '../type/reducer';
import { TranslatorFuncType } from '../type/translator';

export default class AwesomeI18n {
  config: ConfigType = getDefaultConfig();

  constructor(config: Partial<ConfigType> = {}) {
    // 合并自定义 config
    this.config = {
      ...this.config,
      ...config,
    };
  }

  getInputFiles() {
    return glob.sync(this.config.input);
  }

  readFile(filePath) {
    return fs.readFileSync(filePath, { encoding: 'utf-8' });
  }

  /**
   * 翻译到指定语言
   */
  async translate(
    reduceResult: ReduceResultType,
    lang: string
  ): Promise<{ [key: string]: string }> {
    const translator: TranslatorFuncType =
      typeof this.config.translator === 'string'
        ? require(require.resolve(this.config.translator))
        : this.config.translator;
    // 所有需要翻译的 keyword
    const keywords = _.chain(reduceResult)
      .map(r => r.keywords)
      .flatten()
      .uniq()
      .value();
    // 按语言分组串行翻译
    const chunkList = _.chunk(keywords, 20);
    const keywordMap: { [key: string]: string } = {};
    for (const chunk of chunkList) {
      const temp = await Promise.all(
        _.map(chunk, k => {
          const { defaultLang } = this.config;
          // 若目标语言 === 默认语言，则原样返回
          if (defaultLang === lang)
            return {
              message: k,
              origin: k,
            };
          return translator(k, { from: defaultLang, to: lang }).then(r => ({
            ...r,
            origin: k,
          }));
        })
      );
      _.forEach(temp, t => {
        keywordMap[t.origin] = t.message;
      });
    }
    // 替换翻译文案
    const translatedResult = _.mapValues(reduceResult, r => {
      let message = r.message;
      _.forEach(r.keywords, k => {
        message = message.replace(k, keywordMap[k]);
      });
      return message;
    });
    return translatedResult;
  }

  /**
   * 执行所有语言的翻译
   */
  async translateAll(reduceResult: ReduceResultType) {
    const result: { [lang: string]: { [key: string]: string } } = {};
    for (const lang of this.config.langs) {
      result[lang] = await this.translate(reduceResult, lang);
    }
    return result;
  }

  /**
   * 导出多语言文件
   */
  dump(result: { [key: string]: string }, lang: string) {
    fs.writeFileSync(
      path.join(this.config.output, `${lang}.json`),
      JSON.stringify(result, null, 2),
      { encoding: 'utf-8' }
    );
  }

  async run() {
    const inputFiles = this.getInputFiles();
    // load，提取所有多语言文案
    const loaderResultList = _.chain(inputFiles)
      .map(filePath => {
        const loader = _.find(this.config.loader, ({ test }) => test.test(filePath));
        if (!loader) throw new Error(`${filePath} 找不到对应的 loader`);

        const Loader: LoaderConstructor = require(require.resolve(loader.use)).default;
        const parseResult = new Loader().parse(this.readFile(filePath));
        return parseResult;
      })
      .flatten()
      .value();

    // reduce，合并多语言文案
    const Reducer: ReducerConstructor = require(require.resolve(this.config.reducer)).default;
    const reducerIns = new Reducer();
    const reduceResult = reducerIns.reduce(_.map(loaderResultList, r => r.mark), []);

    // 翻译
    const translateResult = await this.translateAll(reduceResult);
    // 导出
    for (const lang of this.config.langs) {
      this.dump(translateResult[lang], lang);
    }

    return translateResult;
  }
}
