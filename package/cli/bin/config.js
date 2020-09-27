const path = require('path');

function getUserConfig(filePath) {
  const config = require(require.resolve(path.join(process.cwd(), filePath)));

  return {
    input: '.',
    ignore: ['**/node_modules/**'],
    output: './i18n',
    defaultLang: 'zh-cn',
    langs: ['zh-cn', 'en'],
    loader: [
      {
        test: '/\\.tsx?$/',
        use: 'ai18n-loader-ts',
      },
      {
        test: '/\\.jsx?$/',
        use: 'ai18n-loader-ts',
      },
    ],
    reducer: 'ai18n-reducer',
    translator: 'ai18n-translator-google',

    // 合并自定义配置
    ...config,
  };
}

module.exports = {
  getUserConfig,
};
