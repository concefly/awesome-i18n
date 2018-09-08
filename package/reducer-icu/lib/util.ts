import {
  build,
  MessageFormatPattern,
  TokenType,
  ArgumentElement,
  selectFormat,
  OptionalFormatPattern,
  PatternBase,
  MessageTextElement,
} from './icu';
import * as _ from 'lodash';

export function buildSimpleTextPattern(text: string): MessageFormatPattern {
  return {
    type: TokenType.messageFormatPattern,
    elements: [{ type: TokenType.messageTextElement, value: text } as MessageTextElement],
  };
}

export function buildSimpleSelectPattern(
  contextValue: string,
  optionList: { selector: string; message: string | PatternBase }[]
) {
  const ast: MessageFormatPattern = {
    type: TokenType.messageFormatPattern,
    elements: [
      {
        type: TokenType.argumentElement,
        id: contextValue,
        format: {
          type: TokenType.selectFormat,
          options: optionList.map(
            opt =>
              ({
                type: TokenType.optionalFormatPattern,
                selector: opt.selector,
                value:
                  typeof opt.message === 'string'
                    ? buildSimpleTextPattern(opt.message)
                    : opt.message,
              } as OptionalFormatPattern)
          ),
        } as selectFormat,
      } as ArgumentElement,
    ],
  };
  return ast;
}

/**
 * 合并对象
 *
 * - 从 source 新增 incoming 带入的字段
 * - 重合字段执行 resolve 逻辑
 * - 可选: 从 source 删除 incoming 没带入的字段
 */
export function mergeValues<A = any, B = A, C = A>(
  source: { [key: string]: A },
  incoming: { [key: string]: B },
  resolve: (sourceValue: A, incomingValue: B) => C,
  opt: { noDrop?: boolean } = {}
) {
  let re: { [key: string]: C } = {};
  const sourceKeys = _.keys(source);
  const incomingKeys = _.keys(incoming);
  // 待新增的字段
  const appendList = _.difference(incomingKeys, sourceKeys);
  // 重合的字段
  const conflictList = _.intersection(sourceKeys, incomingKeys);
  // 冲突合并
  const resolved = _.chain(source)
    .pick(conflictList)
    .mapValues((value, key) => resolve(value, incoming[key]))
    .value();
  if (opt.noDrop) {
    _.merge(re, source, incoming, resolved);
  } else {
    _.merge(re, resolved, _.pick(incoming, appendList));
  }
  return re;
}
