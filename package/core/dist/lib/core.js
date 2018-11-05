"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob = require("glob");
const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const config_1 = require("./config");
class AwesomeI18n {
    constructor(config = {}, opt = {}) {
        this.config = config_1.getDefaultConfig();
        // 合并自定义 config
        this.config = Object.assign({}, this.config, config);
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
    getDumpFilePath(lang) {
        if (!this.getFs().existsSync(this.config.output)) {
            this.getFs().mkdirSync(this.config.output);
        }
        const filePath = path.join(this.config.output, `${lang}.json`);
        if (!this.getFs().existsSync(filePath)) {
            this.getFs().writeFileSync(filePath, '{}', 'utf-8');
        }
        return filePath;
    }
    getTranslator() {
        const { translator } = this.config;
        if (typeof translator === 'string') {
            return require(translator);
        }
        if (typeof translator === 'function') {
            return translator;
        }
        if (Array.isArray(translator)) {
            const func = require(translator[0]);
            return (...props) => func(...props, translator[1]);
        }
        throw new Error(`translator 定义有误`);
    }
    /**
     * 翻译到指定语言
     */
    translate(reduceResult, lang) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const keywordMap = {};
            for (const chunk of chunkList) {
                const temp = yield Promise.all(_.map(chunk, k => {
                    // 若目标语言 === 默认语言，则原样返回
                    if (defaultLang === lang)
                        return {
                            message: k,
                            origin: k,
                        };
                    return translator(k, { from: defaultLang, to: lang })
                        .then(r => (Object.assign({}, r, { origin: k })))
                        .catch(e => {
                        console.error(e);
                        return {
                            message: k,
                            origin: k,
                        };
                    });
                }));
                _.forEach(temp, t => {
                    keywordMap[t.origin] = t.message;
                    console.log(t.origin, t.message, defaultLang, lang);
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
        });
    }
    /**
     * 导出多语言文件
     */
    dump(result, lang) {
        this.getFs().writeFileSync(this.getDumpFilePath(lang), JSON.stringify(result, null, 2), {
            encoding: 'utf-8',
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const inputFiles = this.getInputFiles();
            // load，提取所有多语言文案
            const loaderResultList = _.chain(inputFiles)
                .map(filePath => {
                const loaders = _.filter(this.config.loader, ({ test }) => test.test(filePath));
                if (loaders.length === 0)
                    throw new Error(`${filePath} 找不到对应的 loader`);
                return _.map(loaders, lo => (Object.assign({}, lo, { filePath })));
            })
                .flatten()
                .map(loader => {
                const Loader = require(loader.use).default;
                this.opt.hook && this.opt.hook.beforeLoad && this.opt.hook.beforeLoad(loader.filePath);
                const parseResult = new Loader().parse(this.readFile(loader.filePath), loader.filePath);
                this.opt.hook &&
                    this.opt.hook.afterLoad &&
                    this.opt.hook.afterLoad(loader.filePath, parseResult);
                return parseResult;
            })
                .flatten()
                .value();
            this.opt.hook && this.opt.hook.afterLoadAll && this.opt.hook.afterLoadAll(loaderResultList);
            // reduce，合并多语言文案
            const Reducer = require(this.config.reducer).default;
            const reducerIns = new Reducer();
            let finalMap = {};
            // 循环处理每种语言
            for (const lang of this.config.langs) {
                const srcResultList = reducerIns.extract(JSON.parse(this.readFile(this.getDumpFilePath(lang))));
                const reduceResult = reducerIns.reduce(_.map(loaderResultList, r => r.mark), srcResultList);
                const translateResult = yield this.translate(reduceResult, lang);
                // 字段排序
                const sortedTranslateResult = _.pick(translateResult, _.chain(translateResult)
                    .keys()
                    .sort()
                    .value());
                this.dump(sortedTranslateResult, lang);
                finalMap[lang] = sortedTranslateResult;
            }
            return finalMap;
        });
    }
}
exports.AwesomeI18n = AwesomeI18n;
