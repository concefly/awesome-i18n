import * as glob from 'glob';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { IConfig } from './config';
import {
  IBaseLoader,
  IBaseReducer,
  BaseTranslator,
  LoadResult,
  ReduceResult,
  IBaseTranslator,
  BaseLog,
  ILocalizeMsgMap,
  TranslateCtx,
  TranslateItem,
} from 'ai18n-type';

export class AwesomeI18n {
  constructor(readonly config: IConfig) {}

  private logger = this.config.logger === null ? null : new (this.config.logger || BaseLog)();

  getFs() {
    return fs;
  }

  getInputFiles() {
    return glob.sync(this.config.input, {
      absolute: true,
      nodir: true,
      dot: true,
      ignore: this.config.ignore || [],
    });
  }

  readFile(filePath: string) {
    return this.getFs().readFileSync(filePath, 'utf-8');
  }

  getTranslator(): BaseTranslator {
    const { translator } = this.config;

    if (typeof translator === 'string') {
      const Cls: IBaseTranslator = require(translator).default || require(translator);
      return new Cls();
    }

    if (translator instanceof BaseTranslator) {
      return translator;
    }
    throw new Error(`translator 定义有误`);
  }

  /**
   * 翻译到指定语言
   */
  async translate(reduceResult: ReduceResult, lang: string): Promise<{ [key: string]: string }> {
    const keywords = new Set<string>();
    reduceResult.data.forEach(d => {
      d.value.translates.forEach(t => keywords.add(t));
    });

    // 没有要翻译的文本，直接退出
    if (keywords.size === 0) return reduceResult.toLocalizeMsgMap();

    const defaultLang = 'zh-cn';

    // 所有需要翻译的 keyword
    const transCtx = new TranslateCtx(
      [...keywords].map(text => new TranslateItem(text, defaultLang, lang))
    );

    // 执行翻译
    if (lang === defaultLang) {
      transCtx.list.forEach(d => {
        d.result = { message: d.text };
      });
    } else {
      const translator = this.getTranslator();
      await translator.translate(transCtx);
    }

    this.config.hook?.afterTranslate?.(transCtx);

    const keywordMap: { [key: string]: string } = {};
    transCtx.list.forEach(d => {
      if (d.result) {
        keywordMap[d.text] = d.result.message;
      }
    });

    const localizeMsgMap = reduceResult.toLocalizeMsgMap(t => {
      let msg = t.value.dumpStr;

      // 替换翻译文案
      t.value.translates.forEach(k => {
        msg = msg.replace(k, keywordMap[k] || '');
      });

      return msg;
    });

    return localizeMsgMap;
  }

  async dumpJSON(data: any, filename: string) {
    // 创建文件夹
    if (!this.getFs().existsSync(this.config.output)) {
      this.getFs().mkdirSync(this.config.output);
    }

    const filePath = path.join(this.config.output, filename);
    const content = JSON.stringify(data, null, 2);

    this.logger?.log(`[导出] ${filename}`);
    this.getFs().writeFileSync(filePath, content, { encoding: 'utf-8' });
  }

  /**
   * 读取多语言文件
   */
  async getLang(lang: string): Promise<ILocalizeMsgMap | undefined> {
    const filename = path.join(this.config.output, `${lang}.json`);
    if (!this.getFs().existsSync(filename)) return;

    return JSON.parse(this.readFile(filename));
  }

  /**
   * 导出多语言文件
   */
  async dumpLang(result: { [key: string]: string }, lang: string) {
    this.dumpJSON(result, `${lang}.json`);
  }

  async run() {
    const inputFiles = this.getInputFiles();
    this.logger?.log(`[载入源文件] ${inputFiles.length}`);

    // load，提取所有多语言文案
    const loaderResult = _.chain(inputFiles)
      .map(filePath => {
        const loaders = _.filter(this.config.loader, ({ test }) => {
          const reg =
            typeof (test as any).test === 'function' ? (test as RegExp) : new RegExp(test);

          return reg.test(filePath);
        });
        if (loaders.length === 0) throw new Error(`${filePath} 找不到对应的 loader`);

        return _.map(loaders, lo => ({ ...lo, filePath }));
      })
      .flatten()
      .map(loader => {
        const Loader: IBaseLoader = require(loader.use).default || require(loader.use);
        this.config.hook?.beforeLoad?.(loader.filePath);

        const fileLoaderResult = new Loader().parse(
          this.readFile(loader.filePath),
          loader.filePath
        );

        this.config.hook?.afterLoad?.(loader.filePath, fileLoaderResult);
        return fileLoaderResult;
      })
      .flatten()
      .reduce((r, c) => r.merge(c), new LoadResult([]))
      .value();

    this.logger?.log(`[载入文案] ${loaderResult.list.length}`);
    this.config.hook?.afterLoadAll?.(loaderResult);

    // reduce，合并多语言文案
    const Reducer: IBaseReducer =
      require(this.config.reducer).default || require(this.config.reducer);
    const reducerIns = new Reducer();

    let finalMap: {
      [lang: string]: {
        [key: string]: string;
      };
    } = {};

    // 循环处理每种语言
    for (const lang of this.config.langs) {
      const localMsgJson = (await this.getLang(lang)) || {};
      const extractResult = reducerIns.extract(localMsgJson);
      const reduceResult = reducerIns.reduce(loaderResult, extractResult);

      this.logger?.log(`[合并文案][${lang}] ${reduceResult.data.size}`);
      this.config.hook?.afterReduce?.(reduceResult, { extractResult, localMsgJson });

      const translateResult = await this.translate(reduceResult, lang);

      // 字段排序
      const sortedTranslateResult = _.pick(translateResult, _.keys(translateResult).sort());

      await this.dumpLang(sortedTranslateResult, lang);
      finalMap[lang] = sortedTranslateResult;
    }

    return finalMap;
  }
}
