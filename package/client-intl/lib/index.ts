import IntlMessageFormat from "intl-messageformat";
import memoize from "fast-memoize";

export interface MessageType {
  [key: string]: string;
}

/**
 * 创建多语言 api
 */
export const createIntl = (
  opt: {
    message: MessageType;
    lang: string;
  },
  /** @deprecated 不要用这个参数了 */
  assignTo?
) => {
  const getCacheMsgFormat = memoize(
    (text: string) => new IntlMessageFormat(opt.message[text] || text, opt.lang)
  );

  // 通用翻译 api
  const __ = (text: string, description?: string, values?: any) => {
    try {
      const msg = getCacheMsgFormat(text);
      return msg.format({ description, ...values });
    } catch (e) {
      console.warn(e);
      return text;
    }
  };

  // 用于定义多语言文案的空函数
  const __define = (_text: string, _description?: string) => void 0;

  const api = { __, __define };

  if (assignTo) Object.assign(assignTo, api);

  return api;
};
