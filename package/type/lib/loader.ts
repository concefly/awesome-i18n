export const DEFAULT_DESCRIPTION = 'other';

export class LoadResultItem {
  constructor(
    readonly key: string,
    readonly description: string = DEFAULT_DESCRIPTION,
    readonly extra?: {
      /** 已有的翻译文案 */
      readonly msg?: string;
    }
  ) {}
}

export class LoadResult {
  constructor(readonly list: LoadResultItem[]) {}

  add(item: LoadResultItem) {
    this.list.push(item);
    return this;
  }

  merge(incoming: LoadResult) {
    incoming.list.forEach(d => this.list.push(d));
    return this;
  }
}

export abstract class BaseLoader {
  abstract parse(code: string, filePath: string): LoadResult;
}

export interface IBaseLoader extends BaseLoader {
  new (): BaseLoader;
}
