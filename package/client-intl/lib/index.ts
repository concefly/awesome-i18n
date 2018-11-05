import IntlMessageFormat from 'intl-messageformat';

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
  assignTo?
) => {
  // 通用翻译 api
  const __ = (text: string, description?: string, values?: any) => {
    try {
      const msg = new IntlMessageFormat(opt.message[text] || text, opt.lang);
      return msg.format({
        description,
        ...values,
      });
    } catch (e) {
      return text;
    }
  };

  // 用于定义多语言文案的空函数
  const __define = (text: string, description?: string) => void 0;

  const api = { __, __define };

  if (assignTo) {
    Object.assign(assignTo, api);
  }

  return api;
};
