# awesome i18n

一个基于 node 的全流程前端 i18n 解决方案。

- 极简 api，零使用门槛
- 全自动收集，并剔除冗余文案
- 自动机器翻译

```javascript
import { createIntl } from 'ai18n-client';
import message from '../../config/locale/en';

createIntl({
  // 自动生成的 message: { 中文: '{description, select, inButton {Chinese1} inMenu {Chinese2} other {Chinese}}' },
  message,
  lang: 'en'
}, window);

const message = __('中文');
const button = <div>{ __('中文 {count}', 'inButton', { count: 12 }) }</div>;
const menu = <div>{ __('中文 {count}', 'inMenu', { count: 12 }) }</div>;
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
node ./node_modules/.bin/ai18n all
```

## Typescript 源码支持

使用 ai18n-loader-ts

```javascript
loader: [
  {
    test: /\.tsx?$/,
    use: require.resolve('ai18n-loader-ts'),
  },
],
```

## 一词多译

```javascript
// __() 第二个参数控制上下文
const button = <div>{ __('中文 {count}', 'inButton') }</div>;
const menu = <div>{ __('中文 {count}', 'inMenu') }</div>;

// 执行 node ./node_modules/.bin/ai18n all 后可自动获得不同上下文的翻译
message = {
  '中文': '{description, select, inButton {中文} inMenu {中文} other{中文}}'
}
```

## 替换机器翻译工具

```javascript
{
  // 有道翻译
  translator: require.resolve('ai18n-translator-youdao')
}
```
