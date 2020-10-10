#!/usr/bin/env node
import AI18n, { IConfig } from 'ai18n-core';
import * as diffUtil from 'jsondiffpatch';
import { getUserConfig } from './config';
import * as yargs from 'yargs';

yargs
  .command(
    'check',
    '检查文案变化(可用于 ci)',
    _yargs => {},
    argv => {
      const userConfig = getUserConfig(argv.config as string);

      const stopError = new Error('停止');

      const config: IConfig = {
        ...userConfig,
        hook: {
          afterReduce: (result, extra) => {
            userConfig.hook?.afterReduce?.(result, extra);

            const reduceMsgKeys = [...result.data.keys()].sort();
            const localMsgKeys = Object.keys(extra.localMsgJson).sort();

            // 求 diff
            const diffDelta = diffUtil.diff(localMsgKeys, reduceMsgKeys);
            if (diffDelta) {
              const output = diffUtil.formatters.console.format(diffDelta, undefined);
              throw new Error('文案有变化，请执行 ai18n run 以更新文案\n' + output);
            }

            // 到这里可以主动停止
            throw stopError;
          },
        },
      };

      // 开始执行
      new AI18n(config).run().catch(e => {
        // 主动停止
        if (e === stopError) return;

        // 异常停止要 exit 1
        console.error(e);
        process.exit(1);
      });
    }
  )
  .command(
    'run',
    '执行 i18n',
    _yargs => {},
    argv => {
      const config = getUserConfig(argv.config as string);

      // 开始执行
      new AI18n(config).run().catch(e => {
        console.error(e);
        process.exit(1);
      });
    }
  )
  .option('verbose', {
    alias: 'v',
    default: false,
  })
  .option('config', {
    default: './ai18n.json',
  }).argv;
