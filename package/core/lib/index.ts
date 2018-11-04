import * as glob from 'glob';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigType, getDefaultConfig } from './config';
import { LoaderConstructor } from '../type/loader';
import { ReducerConstructor, ReduceResultType, ReduceSourceType } from '../type/reducer';
import { TranslatorFuncType } from '../type/translator';

export interface OptType {
  hook?: {
    beforeLoad?: (filePath: string) => void;
    afterLoad?: (filePath: string, result: any) => void;
    afterLoadAll?: (result: any) => void;
    afterTranslate?: (src: string, result: string, from: string, to: string) => void;
  };
}

export default class AwesomeI18n {
  config: ConfigType = getDefaultConfig();
  opt: OptType;

  constructor(config: Partial<ConfigType> = {}, opt: OptType = {}) {
    // 合并自定义 config
    this.config = {
      ...this.config,
      ...config,
    };
    this.opt = opt;
  }

  getFs() {
    return fs;
  }

  getInputFiles() {
    return glob.sync(this.config.input);
  }

  readFile(filePath) {
    return this.getFs().readFileSync(filePath, 'utf-8');
  }

  getDumpFilePath(lang: string) {
    if (!this.getFs().existsSync(this.config.output)) {
      this.getFs().mkdirSync(this.config.output);
    }
    const filePath = path.join(this.config.output, `${lang}.json`);
    if (!this.getFs().existsSync(filePath)) {
      this.getFs().writeFileSync(filePath, '{}', 'utf-8');
    }
    return filePath;
  }

  getTranslator(): TranslatorFuncType {
    const { translator } = this.config;
    if (typeof translator === 'string') {
      return require(require.resolve(translator));
    }

    if (typeof translator === 'function') {
      return translator;
    }

    if (Array.isArray(translator)) {
      const func = require(require.resolve(translator[0]));
      return (...props) => func(...props, translator[1]);
    }

    throw new Error(`translator 定义有误`);
  }

  /**
   * 翻译到指定语言
   */
  async translate(
    reduceResult: ReduceResultType,
    lang: string
  ): Promise<{ [key: string]: string }> {
    const { defaultLang } = this.config;
    const translator = this.getTranslator();
    // 所有需要翻译的 keyword
    const keywords = _.chain(reduceResult)
      .map(r => r.keywords)
      .flatten()
      .uniq()
      .value();
    // 按语言分组串行翻译
    const chunkList = _.chunk(keywords, 5);
    const keywordMap: { [key: string]: string } = {};
    for (const chunk of chunkList) {
      const temp = await Promise.all(
        _.map(chunk, k => {
          // 若目标语言 === 默认语言，则原样返回
          if (defaultLang === lang)
            return {
              message: k,
              origin: k,
            };
          return translator(k, { from: defaultLang, to: lang })
            .then(r => ({
              ...r,
              origin: k,
            }))
            .catch(e => {
              console.error(e);
              return {
                message: k,
                origin: k,
              };
            });
        })
      );
      _.forEach(temp, t => {
        keywordMap[t.origin] = t.message;
        this.opt.hook &&
          this.opt.hook.afterTranslate &&
          this.opt.hook.afterTranslate(t.origin, t.message, defaultLang, lang);
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
   * 导出多语言文件
   */
  dump(result: { [key: string]: string }, lang: string) {
    this.getFs().writeFileSync(this.getDumpFilePath(lang), JSON.stringify(result, null, 2), {
      encoding: 'utf-8',
    });
  }

  async run() {
    const inputFiles = this.getInputFiles();

    // load，提取所有多语言文案
    const loaderResultList = _.chain(inputFiles)
      .map(filePath => {
        const loader = _.find(this.config.loader, ({ test }) => test.test(filePath));
        if (!loader) throw new Error(`${filePath} 找不到对应的 loader`);

        const Loader: LoaderConstructor = require(require.resolve(loader.use)).default;

        this.opt.hook && this.opt.hook.beforeLoad && this.opt.hook.beforeLoad(filePath);

        const parseResult = new Loader().parse(this.readFile(filePath), filePath);

        this.opt.hook && this.opt.hook.afterLoad && this.opt.hook.afterLoad(filePath, parseResult);

        return parseResult;
      })
      .flatten()
      .value();

    this.opt.hook && this.opt.hook.afterLoadAll && this.opt.hook.afterLoadAll(loaderResultList);

    // reduce，合并多语言文案
    const Reducer: ReducerConstructor = require(require.resolve(this.config.reducer)).default;
    const reducerIns = new Reducer();

    let finalMap: {
      [lang: string]: {
        [key: string]: string;
      };
    } = {};

    // 循环处理每种语言
    for (const lang of this.config.langs) {
      const srcResultList = reducerIns.extract(
        JSON.parse(this.readFile(this.getDumpFilePath(lang)))
      );
      const reduceResult = reducerIns.reduce(_.map(loaderResultList, r => r.mark), srcResultList);

      const translateResult = await this.translate(reduceResult, lang);

      // 字段排序
      const sortedTranslateResult = _.pick(
        translateResult,
        _.chain(translateResult)
          .keys()
          .sort()
          .value()
      );

      this.dump(sortedTranslateResult, lang);
      finalMap[lang] = sortedTranslateResult;
    }

    return finalMap;
  }
}
