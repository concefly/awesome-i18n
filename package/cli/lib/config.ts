import * as path from 'path';
import { IConfig } from 'ai18n-core';

export function getUserConfig(filePath: string): IConfig {
  const config = require(require.resolve(path.join(process.cwd(), filePath)));

  return {
    input: '.',
    ignore: ['**/node_modules/**'],
    output: './i18n',
    langs: ['en'],
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
    translator: 'ai18n-translator-manual',

    // 合并自定义配置
    ...config,
  };
}
