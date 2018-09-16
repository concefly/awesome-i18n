import * as _ from 'lodash';
import { parse, TokenType, MessageTextElement, ArgumentElement, build } from './icu';
import { buildSimpleSelectPattern, buildSimpleTextPattern, mergeValues } from './util';

export interface MapType<T> {
  [key: string]: T;
}
export interface ConfigType {}
export interface SourceType {
  key: string;
  description?: string;
  message?: string;
}
export interface ResultType {
  [key: string]: {
    message: string;
    /** 待翻译的关键字列表 */
    keywords: string[];
  };
}

// const EMPTY_DESCRIPTION = Symbol('none');
const EMPTY_DESCRIPTION = 'other';

export default class Reducer {
  config: ConfigType;

  constructor(config: ConfigType = {}) {
    this.config = config;
  }

  makeStructure(src: SourceType[]) {
    return (
      _.chain(src)
        .groupBy('key')
        // 补全 description，方便后续 groupBy
        .mapValues(list =>
          _.map(list, item => {
            const re = { ...item };
            if (!re.description) re.description = EMPTY_DESCRIPTION;
            return re;
          })
        )
        .mapValues((payloadList: SourceType[]) =>
          _.chain(payloadList)
            .groupBy('description')
            .mapValues(_.first)
            .value()
        )
        .value()
    );
  }

  extract(raw: { [key: string]: string }): SourceType[] {
    return _.chain(raw)
      .mapValues((value: string, key: string) => {
        const ast = parse(value);
        if (
          ast.elements.length > 1 &&
          ast.elements.some(
            e => e.type === TokenType.argumentElement && !!(e as ArgumentElement).format
          )
        )
          throw new Error('参数选择器存在时，只能有一个 element');
        // 上下文动态文本模式
        if (
          ast.elements[0].type === TokenType.argumentElement &&
          (ast.elements[0] as ArgumentElement).format.type === TokenType.selectFormat
        ) {
          return (ast.elements[0] as ArgumentElement).format.options.map(opt => {
            return {
              key,
              description: opt.selector,
              message: build(opt.value),
            };
          });
        }
        // 原样返回兜底
        return [
          {
            key,
            message: value,
          },
        ];
      })
      .mapValues(v => _.flatten(v))
      .reduce((r, v) => r.concat(v), [])
      .value();
  }

  reduce(incoming: SourceType[], src: SourceType[]): ResultType {
    const incomingStructure = this.makeStructure(incoming);
    const srcStructure = this.makeStructure(src);
    // 两重 merge
    // 1. 合并 key
    const resolvedStructure = mergeValues<MapType<SourceType>>(
      srcStructure,
      incomingStructure,
      (srcDescMap, incomingDescMap) =>
        // 2. 合并上下文
        mergeValues<SourceType>(srcDescMap, incomingDescMap, (s, i) => {
          // source 有 message，则原样返回(不修改源文件的翻译)
          if (s.message) return s;
          else return i;
        })
    );
    // 合并 descMap
    const re = _.mapValues(resolvedStructure, (descMap, key) => {
      const descList = _.keys(descMap);
      // 只有一个 other 上下文，则 message = incomingMessage || key
      if (descList.length === 1 && descList[0] === EMPTY_DESCRIPTION) {
        const incomingMessage = descMap[EMPTY_DESCRIPTION].message;
        const keywords = incomingMessage ? [] : [key];
        const message = incomingMessage || key;
        return { keywords, message };
      } else {
        const keywords: string[] = [];
        const ast = buildSimpleSelectPattern(
          'description',
          _.map(descMap, (s, desc) => {
            // source 里没有 message，则要把 incoming 的 key 加入翻译列表
            if (!s.message) keywords.push(key);
            return {
              selector: desc,
              message: s.message || key,
            };
          })
        );
        return {
          keywords,
          message: build(ast),
        };
      }
    });
    return re;
  }
}
