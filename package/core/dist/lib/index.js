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
    constructor(config = {}) {
        this.config = config_1.getDefaultConfig();
        // 合并自定义 config
        this.config = Object.assign({}, this.config, config);
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
    translate(reduceResult, lang) {
        return __awaiter(this, void 0, void 0, function* () {
            const translator = typeof this.config.translator === 'string'
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
            const keywordMap = {};
            for (const chunk of chunkList) {
                const temp = yield Promise.all(_.map(chunk, k => {
                    const { defaultLang } = this.config;
                    // 若目标语言 === 默认语言，则原样返回
                    if (defaultLang === lang)
                        return {
                            message: k,
                            origin: k,
                        };
                    return translator(k, { from: defaultLang, to: lang }).then(r => (Object.assign({}, r, { origin: k })));
                }));
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
        });
    }
    /**
     * 执行所有语言的翻译
     */
    translateAll(reduceResult) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = {};
            for (const lang of this.config.langs) {
                result[lang] = yield this.translate(reduceResult, lang);
            }
            return result;
        });
    }
    /**
     * 导出多语言文件
     */
    dump(result, lang) {
        fs.writeFileSync(path.join(this.config.output, `${lang}.json`), JSON.stringify(result, null, 2), { encoding: 'utf-8' });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const inputFiles = this.getInputFiles();
            // load，提取所有多语言文案
            const loaderResultList = _.chain(inputFiles)
                .map(filePath => {
                const loader = _.find(this.config.loader, ({ test }) => test.test(filePath));
                if (!loader)
                    throw new Error(`${filePath} 找不到对应的 loader`);
                const Loader = require(require.resolve(loader.use)).default;
                const parseResult = new Loader().parse(this.readFile(filePath));
                return parseResult;
            })
                .flatten()
                .value();
            // reduce，合并多语言文案
            const Reducer = require(require.resolve(this.config.reducer)).default;
            const reducerIns = new Reducer();
            const reduceResult = reducerIns.reduce(_.map(loaderResultList, r => r.mark), []);
            // 翻译
            const translateResult = yield this.translateAll(reduceResult);
            // 导出
            for (const lang of this.config.langs) {
                this.dump(translateResult[lang], lang);
            }
            return translateResult;
        });
    }
}
exports.default = AwesomeI18n;
