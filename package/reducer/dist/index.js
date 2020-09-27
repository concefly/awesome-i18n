"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const ai18n_type_1 = require("ai18n-type");
class Reducer extends ai18n_type_1.BaseReducer {
    extract(json) {
        const result = new ai18n_type_1.ExtractResult([]);
        _.forEach(json, (value, key) => {
            const selectMatch = value.match(/^\{description,\s+select,\s+(.*)\}$/);
            if (selectMatch) {
                const optionList = selectMatch[1].split(/\s+/);
                optionList.forEach(opt => {
                    const optMatch = opt.match(/^(.*)\{(.*)\}/);
                    if (optMatch) {
                        const [, description, msg] = optMatch;
                        result.add(new ai18n_type_1.ExtractResultItem(key, description, { msg }));
                    }
                });
                return;
            }
            result.add(new ai18n_type_1.ExtractResultItem(key, undefined, { msg: value }));
        });
        return result;
    }
    reduce(incoming, src) {
        const incomingGroup = _.groupBy(incoming.list, d => d.key);
        const srcGroup = _.groupBy(src.list, d => d.key);
        const incomingKeys = Object.keys(incomingGroup);
        const srcKeys = Object.keys(srcGroup);
        const addKeys = _.difference(incomingKeys, srcKeys);
        const modifyKeys = _.intersection(incomingKeys, srcKeys);
        const result = new ai18n_type_1.ReduceResult();
        // 处理新进入的 key
        addKeys.forEach(key => {
            const list = incomingGroup[key];
            if (list.length === 1) {
                result.data.set(key, new ai18n_type_1.ReduceResultItem(new ai18n_type_1.ICUItem(key, [key])));
            }
            else {
                // 按 description 分组
                const descGroup = _.groupBy(list, d => d.description);
                if (Object.keys(descGroup).length === 1) {
                    // 只有一个 description
                    result.data.set(key, new ai18n_type_1.ReduceResultItem(new ai18n_type_1.ICUItem(key, [key])));
                }
                else {
                    const translates = new Set();
                    let optionList = [];
                    _.map(descGroup, ([d], desc) => {
                        translates.add(d.key);
                        optionList.push(`${desc}{${d.key}}`);
                    });
                    // 排序
                    optionList.sort();
                    result.data.set(key, new ai18n_type_1.ReduceResultItem(new ai18n_type_1.ICUItem(`{description, select, ${optionList.join(' ')}}`, [...translates])));
                }
            }
        });
        // 处理修改的 key
        modifyKeys.forEach(key => {
            const incomingList = incomingGroup[key].map(d => ({
                d,
                from: 'incoming',
            }));
            const srcList = srcGroup[key].map(d => ({
                d,
                from: 'src',
            }));
            /** 尝试找已存在的翻译文案 */
            const tryGetExistMsg = (descList) => {
                var _a, _b, _c, _d;
                // 首先找 src 当前 description 的列表
                const msg = ((_b = (_a = descList.find(d => { var _a; return d.from === 'src' && ((_a = d.d.extra) === null || _a === void 0 ? void 0 : _a.msg); })) === null || _a === void 0 ? void 0 : _a.d.extra) === null || _b === void 0 ? void 0 : _b.msg) || ((_d = (_c = 
                // 然后找 src 当前 key 的列表
                srcList.find(d => { var _a; return (_a = d.d.extra) === null || _a === void 0 ? void 0 : _a.msg; })) === null || _c === void 0 ? void 0 : _c.d.extra) === null || _d === void 0 ? void 0 : _d.msg);
                return msg;
            };
            // 按 description 分组
            const descGroup = _.groupBy([...incomingList, ...srcList], d => d.d.description);
            if (_.size(descGroup) === 1) {
                // 只有一个 description 分组
                const descList = descGroup[_.keys(descGroup)[0]];
                // 尝试找翻译文案
                const msg = tryGetExistMsg(descList);
                result.data.set(key, new ai18n_type_1.ReduceResultItem(msg
                    ? // 已有翻译文案，直接复用
                        new ai18n_type_1.ICUItem(msg)
                    : new ai18n_type_1.ICUItem(key, [key])));
            }
            else {
                // 有多个 description 分组
                const translates = new Set();
                let optionList = [];
                _.map(descGroup, (descList, desc) => {
                    const msg = tryGetExistMsg(descList);
                    if (!msg)
                        translates.add(key);
                    optionList.push(`${desc}{${msg || key}}`);
                });
                // 排序
                optionList.sort();
                result.data.set(key, new ai18n_type_1.ReduceResultItem(new ai18n_type_1.ICUItem(`{description, select, ${optionList.join(' ')}}`, [...translates])));
            }
        });
        return result;
    }
}
exports.default = Reducer;
