import * as glob from "glob";
import * as _ from "lodash";
import * as fs from "fs";
import * as path from "path";
import { IConfig, getDefaultConfig } from "./config";
import {
  IBaseLoader,
  IBaseReducer,
  BaseTranslator,
  LoadResult,
  ReduceResult,
  IBaseTranslator,
} from "ai18n-type";

export class AwesomeI18n {
  config: IConfig = getDefaultConfig();

  constructor(config: Partial<IConfig> = {}) {
    // 合并自定义 config
    this.config = {
      ...this.config,
      ...config,
    };
  }

  getFs() {
    return fs;
  }

  getInputFiles() {
    return glob.sync(this.config.input);
  }

  readFile(filePath: string) {
    return this.getFs().readFileSync(filePath, "utf-8");
  }

  getDumpFilePath(lang: string) {
    if (!this.getFs().existsSync(this.config.output)) {
      this.getFs().mkdirSync(this.config.output);
    }
    const filePath = path.join(this.config.output, `${lang}.json`);
    if (!this.getFs().existsSync(filePath)) {
      this.getFs().writeFileSync(filePath, "{}", "utf-8");
    }
    return filePath;
  }

  getTranslator(): BaseTranslator {
    const { translator } = this.config;

    if (typeof translator === "string") {
      const Cls: IBaseTranslator = require(translator).default;
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
  async translate(
    reduceResult: ReduceResult,
    lang: string
  ): Promise<{ [key: string]: string }> {
    const { defaultLang } = this.config;
    const translator = this.getTranslator();

    const translates = new Set<string>();
    reduceResult.data.forEach((d) => {
      d.value.translates.forEach((t) => translates.add(t));
    });

    // 所有需要翻译的 keyword
    const keywords = [...translates];

    // 按语言分组串行翻译
    const chunkList = _.chunk(keywords, 5);
    const keywordMap: { [key: string]: string } = {};
    for (const chunk of chunkList) {
      const temp = await Promise.all(
        _.map(chunk, (k) => {
          // 若目标语言 === 默认语言，则原样返回
          if (defaultLang === lang)
            return {
              message: k,
              origin: k,
            };
          return translator
            .translate(k, { from: defaultLang, to: lang })
            .then((r) => ({
              ...r,
              origin: k,
            }))
            .catch((e) => {
              console.error(e);
              return {
                message: k,
                origin: k,
              };
            });
        })
      );

      _.forEach(temp, (t) => {
        keywordMap[t.origin] = t.message;
        this.config.hook?.afterTranslate?.(
          t.origin,
          t.message,
          defaultLang,
          lang
        );
      });
    }

    const localizeMsgMap = reduceResult.toLocalizeMsgMap((t) => {
      let msg = t.value.dumpStr;

      // 替换翻译文案
      t.value.translates.forEach((k) => {
        msg = msg.replace(k, keywordMap[k]);
      });

      return msg;
    });

    return localizeMsgMap;
  }

  /**
   * 导出多语言文件
   */
  async dump(result: { [key: string]: string }, lang: string) {
    const filePath = this.getDumpFilePath(lang);
    const content = JSON.stringify(result, null, 2);

    this.getFs().writeFileSync(filePath, content, {
      encoding: "utf-8",
    });

    if (this.config.generator) {
      const p = await this.config.generator({ lang, result });
      this.getFs().writeFileSync(
        p.filePath.startsWith("/")
          ? p.filePath
          : path.join(this.config.output, p.filePath),
        p.content,
        {
          encoding: "utf-8",
        }
      );
    }
  }

  async run() {
    const inputFiles = this.getInputFiles();

    // load，提取所有多语言文案
    const loaderResult = _.chain(inputFiles)
      .map((filePath) => {
        const loaders = _.filter(this.config.loader, ({ test }) =>
          test.test(filePath)
        );
        if (loaders.length === 0)
          throw new Error(`${filePath} 找不到对应的 loader`);
        return _.map(loaders, (lo) => ({ ...lo, filePath }));
      })
      .flatten()
      .map((loader) => {
        const Loader: IBaseLoader = require(loader.use).default;

        this.config.hook?.beforeLoad?.(loader.filePath);

        const loadResult = new Loader().parse(
          this.readFile(loader.filePath),
          loader.filePath
        );

        this.config.hook?.afterLoad?.(loader.filePath, loadResult);

        return loadResult;
      })
      .flatten()
      .reduce((r, c) => r.merge(c), new LoadResult([]))
      .value();

    this.config.hook?.afterLoadAll?.(loaderResult);

    // reduce，合并多语言文案
    const Reducer: IBaseReducer = require(this.config.reducer).default;
    const reducerIns = new Reducer();

    let finalMap: {
      [lang: string]: {
        [key: string]: string;
      };
    } = {};

    // 循环处理每种语言
    for (const lang of this.config.langs) {
      const msgJson = JSON.parse(this.readFile(this.getDumpFilePath(lang)));
      const extractResult = reducerIns.extract(msgJson);

      const reduceResult = reducerIns.reduce(loaderResult, extractResult);
      this.config.hook?.afterReduce?.(reduceResult);

      const translateResult = await this.translate(reduceResult, lang);

      // 字段排序
      const sortedTranslateResult = _.pick(
        translateResult,
        _.keys(translateResult).sort()
      );

      await this.dump(sortedTranslateResult, lang);
      finalMap[lang] = sortedTranslateResult;
    }

    return finalMap;
  }
}
