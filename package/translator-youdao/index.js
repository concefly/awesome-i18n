const SparkMD5 = require('spark-md5');
const axios = require('axios');
const { BaseTranslator } = require('ai18n-type');
const crypto = require('crypto');

const API = 'https://openapi.youdao.com/api';

module.exports = class YoudaoTranslator extends BaseTranslator {
  appKey = '';
  secretKey = '';

  constructor(appKey, secretKey) {
    super();
    this.appKey = appKey;
    this.secretKey = secretKey;
  }

  /**
   * 执行翻译
   *
   * @param {string} text   原文
   * @param {{ from: string, to: string }} opt
   */
  async translate(text, opt) {
    const curtime = Math.round(new Date().getTime() / 1000);
    const salt = Math.floor(Math.random() * 10000);
    const sign = crypto
      .createHash('sha256')
      .update(
        this.appKey +
          (text.length <= 20
            ? text
            : text.slice(0, 10) + text.length + text.slice(text.length - 10, text.length)) +
          salt +
          curtime +
          this.secretKey
      )
      .digest('hex');

    const { data } = await axios.get(API, {
      responseType: 'json',
      params: {
        q: text,
        from: opt.from,
        to: opt.to,
        appKey: this.appKey,
        salt: salt,
        sign,
        signType: 'v3',
        curtime,
      },
    });

    if (+data.errorCode) {
      throw new Error(`“${text}” 翻译失败: ${data.errorCode}`);
    }

    return { message: data.translation[0] };
  }
};
