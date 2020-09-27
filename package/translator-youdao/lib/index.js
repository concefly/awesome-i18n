const SparkMD5 = require('spark-md5');
const axios = require('axios');

const API = 'http://openapi.youdao.com/api';

function genSign(appKey, q, salt, secretKey) {
  return SparkMD5.hash(appKey + q + salt + secretKey).toUpperCase();
}

function translatorYoudao(text, opt, config) {
  const salt = Math.floor(Math.random() * 10000);
  return axios
    .get(API, {
      responseType: 'json',
      params: {
        q: encodeURIComponent(text),
        from: encodeURIComponent(opt.from),
        to: encodeURIComponent(opt.to),
        appKey: encodeURIComponent(config.appKey),
        salt: encodeURIComponent(salt),
        sign: encodeURIComponent(genSign(config.appKey, text, salt, config.secretKey)),
      },
    })
    .then(({ data }) => {
      if (+data.errorCode) {
        throw new Error(`“${text}” 翻译失败: ${data.errorCode}`);
      }
      return { message: data.translation[0] };
    });
}

module.exports = translatorYoudao;
