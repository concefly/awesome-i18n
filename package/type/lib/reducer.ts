import { ICUItem } from './icu';
import { LoadResult, LoadResultItem } from './loader';

export interface ILocalizeMsgMap {
  [key: string]: string;
}

export class ReduceResultItem {
  constructor(readonly value: ICUItem) {}
}

export class ExtractResultItem extends LoadResultItem {}

export class ExtractResult extends LoadResult {
  constructor(readonly list: ExtractResultItem[]) {
    super(list);
  }

  add(item: ExtractResultItem) {
    this.list.push(item);
    return this;
  }
}

export class ReduceResult {
  constructor(readonly data: Map<string, ReduceResultItem> = new Map()) {}

  toLocalizeMsgMap(mapper = (t: ReduceResultItem) => t.value.dumpStr) {
    const result: ILocalizeMsgMap = {};

    for (const [key, item] of this.data.entries()) {
      result[key] = mapper(item);
    }

    return result;
  }
}

export abstract class BaseReducer {
  /** 提取 */
  abstract extract(json: ILocalizeMsgMap): ExtractResult;

  /** 聚合 */
  abstract reduce(incoming: LoadResult, origin: ExtractResult): ReduceResult;
}

export interface IBaseReducer extends BaseReducer {
  new (): BaseReducer;
}
