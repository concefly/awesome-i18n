const translate = require('google-translate-api');
const { BaseTranslator } = require('ai18n-type');

class GoogleTranslator extends BaseTranslator {
  parallel = 1;

  /**
   * 执行翻译
   *
   * @param {string} text   原文
   * @param {{ from: string, to: string }} opt
   */
  translate(text, opt) {
    return translate(text, {
      from: opt.from,
      to: opt.to,
    }).then(res => ({
      message: res.text,
    }));
  }
}

module.exports = GoogleTranslator;
