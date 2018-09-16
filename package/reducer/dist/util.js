"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const icu_1 = require("./icu");
const _ = require("lodash");
function buildSimpleTextPattern(text) {
    return {
        type: icu_1.TokenType.messageFormatPattern,
        elements: [{ type: icu_1.TokenType.messageTextElement, value: text }],
    };
}
exports.buildSimpleTextPattern = buildSimpleTextPattern;
function buildSimpleSelectPattern(contextValue, optionList) {
    const ast = {
        type: icu_1.TokenType.messageFormatPattern,
        elements: [
            {
                type: icu_1.TokenType.argumentElement,
                id: contextValue,
                format: {
                    type: icu_1.TokenType.selectFormat,
                    options: optionList.map(opt => ({
                        type: icu_1.TokenType.optionalFormatPattern,
                        selector: opt.selector,
                        value: typeof opt.message === 'string'
                            ? buildSimpleTextPattern(opt.message)
                            : opt.message,
                    })),
                },
            },
        ],
    };
    return ast;
}
exports.buildSimpleSelectPattern = buildSimpleSelectPattern;
/**
 * 合并对象
 *
 * - 从 source 新增 incoming 带入的字段
 * - 重合字段执行 resolve 逻辑
 * - 可选: 从 source 删除 incoming 没带入的字段
 */
function mergeValues(source, incoming, resolve, opt = {}) {
    let re = {};
    const sourceKeys = _.keys(source);
    const incomingKeys = _.keys(incoming);
    // 待新增的字段
    const appendList = _.difference(incomingKeys, sourceKeys);
    // 重合的字段
    const conflictList = _.intersection(sourceKeys, incomingKeys);
    // 冲突合并
    const resolved = _.chain(source)
        .pick(conflictList)
        .mapValues((value, key) => resolve(value, incoming[key]))
        .value();
    if (opt.noDrop) {
        _.merge(re, source, incoming, resolved);
    }
    else {
        _.merge(re, resolved, _.pick(incoming, appendList));
    }
    return re;
}
exports.mergeValues = mergeValues;
