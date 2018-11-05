"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const intl_messageformat_1 = require("intl-messageformat");
/**
 * 创建多语言 api
 */
exports.createIntl = (opt, assignTo) => {
    // 通用翻译 api
    const __ = (text, description, values) => {
        try {
            const msg = new intl_messageformat_1.default(opt.message[text] || text, opt.lang);
            return msg.format(Object.assign({ description }, values));
        }
        catch (e) {
            return text;
        }
    };
    // 用于定义多语言文案的空函数
    const __define = (text, description) => void 0;
    const api = { __, __define };
    if (assignTo) {
        Object.assign(assignTo, api);
    }
    return api;
};
