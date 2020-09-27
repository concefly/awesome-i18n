const translate = require('google-translate-api');

/**
 * 执行翻译
 *
 * @param {string} text   原文
 * @param {*} opt.from    原文语言码
 * @param {*} opt.to      译文语言码
 */
module.exports = (text, opt) =>
  translate(text, {
    from: opt.from,
    to: opt.to,
  }).then(res => ({
    message: res.text,
  }));
