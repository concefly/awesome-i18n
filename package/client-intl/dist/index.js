"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIntl = void 0;
const intl_messageformat_1 = __importDefault(require("intl-messageformat"));
const fast_memoize_1 = __importDefault(require("fast-memoize"));
/**
 * 创建多语言 api
 */
exports.createIntl = (opt, 
/** @deprecated 不要用这个参数了 */
assignTo) => {
    const getCacheMsgFormat = fast_memoize_1.default((text) => new intl_messageformat_1.default(opt.message[text] || text, opt.lang));
    // 通用翻译 api
    const __ = (text, description, values) => {
        try {
            const msg = getCacheMsgFormat(text);
            return msg.format(Object.assign({ description }, values));
        }
        catch (e) {
            console.warn(e);
            return text;
        }
    };
    // 用于定义多语言文案的空函数
    const __define = (_text, _description) => void 0;
    const api = { __, __define };
    if (assignTo)
        Object.assign(assignTo, api);
    return api;
};
