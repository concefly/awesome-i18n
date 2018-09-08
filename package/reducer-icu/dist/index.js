"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const icu_1 = require("./icu");
const util_1 = require("./util");
// const EMPTY_DESCRIPTION = Symbol('none');
const EMPTY_DESCRIPTION = 'other';
class Reducer {
    constructor(config = {}) {
        this.config = config;
    }
    makeStructure(src) {
        return (_.chain(src)
            .groupBy('key')
            // 补全 description，方便后续 groupBy
            .mapValues(list => _.map(list, item => {
            const re = Object.assign({}, item);
            if (!re.description)
                re.description = EMPTY_DESCRIPTION;
            return re;
        }))
            .mapValues((payloadList) => _.chain(payloadList)
            .groupBy('description')
            .mapValues(_.first)
            .value())
            .value());
    }
    extract(raw) {
        return _.chain(raw)
            .mapValues((value, key) => {
            const ast = icu_1.parse(value);
            if (ast.elements.length > 1 &&
                ast.elements.some(e => e.type === icu_1.TokenType.argumentElement && !!e.format))
                throw new Error('参数选择器存在时，只能有一个 element');
            // 上下文动态文本模式
            if (ast.elements[0].type === icu_1.TokenType.argumentElement &&
                ast.elements[0].format.type === icu_1.TokenType.selectFormat) {
                return ast.elements[0].format.options.map(opt => {
                    return {
                        key,
                        description: opt.selector,
                        message: icu_1.build(opt.value),
                    };
                });
            }
            // 原样返回兜底
            return [
                {
                    key,
                    message: value,
                },
            ];
        })
            .mapValues(v => _.flatten(v))
            .reduce((r, v) => r.concat(v), [])
            .value();
    }
    reduce(incoming, src) {
        const incomingStructure = this.makeStructure(incoming);
        const srcStructure = this.makeStructure(src);
        // 两重 merge
        // 1. 合并 key
        const resolvedStructure = util_1.mergeValues(srcStructure, incomingStructure, (srcDescMap, incomingDescMap) => 
        // 2. 合并上下文
        util_1.mergeValues(srcDescMap, incomingDescMap, (s, i) => {
            // source 有 message，则原样返回(不修改源文件的翻译)
            if (s.message)
                return s;
            else
                return i;
        }));
        // 合并 descMap
        const re = _.mapValues(resolvedStructure, (descMap, key) => {
            const descList = _.keys(descMap);
            // 只有一个 other 上下文，则 message = incomingMessage || key
            if (descList.length === 1 && descList[0] === EMPTY_DESCRIPTION) {
                const incomingMessage = descMap[EMPTY_DESCRIPTION].message;
                const keywords = incomingMessage ? [] : [key];
                const message = incomingMessage || key;
                return { keywords, message };
            }
            else {
                const keywords = [];
                const ast = util_1.buildSimpleSelectPattern('description', _.map(descMap, (s, desc) => {
                    // source 里没有 message，则要把 incoming 的 key 加入翻译列表
                    if (!s.message)
                        keywords.push(key);
                    return {
                        selector: desc,
                        message: s.message || key,
                    };
                }));
                return {
                    keywords,
                    message: icu_1.build(ast),
                };
            }
        });
        return re;
    }
}
exports.default = Reducer;
