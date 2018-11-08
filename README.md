# awesome i18n

一个基于 node 的全流程前端 i18n 解决方案。

- 极简 api，零使用门槛
- 全自动收集 + 翻译文案

```javascript
import { createIntl } from 'ai18n-client';
import message from '../../config/locale/en';

createIntl({
  // message: { 中文: 'Chinese' },
  message,
  lang: 'en'
}, window);

const message = __('中文');
const app = <div>{ __('中文') }</div>;
```

## 安装

```bash
npm install ai18n-client --save
npm install ai18n-cli ai18n-loader-js ai18n-reducer ai18n-translator-google --save-dev
```

## 配置

项目根目录下，放置 `i18nrc.js`:

```javascript
const { resolve } = require('path');

module.exports = {
  input: resolve(__dirname, './app/web/**/*.js'),
  output: resolve(__dirname, './config/locale'),
  defaultLang: 'zh-cn',
  langs: ['zh-cn', 'en'],
  loader: [
    {
      test: /\.jsx?$/,
      use: require.resolve('ai18n-loader-js'),
    },
  ],
  reducer: require.resolve('ai18n-reducer'),
  translator: require.resolve('ai18n-translator-google'),
}
```

## 执行国际化

```bash
node ./node_modules/.bin/i18n.js all
```