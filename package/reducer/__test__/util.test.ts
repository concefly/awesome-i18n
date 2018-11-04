import { mergeValues } from '../lib/util';

describe('mergeValues', () => {
  it('新增 & 删除', () => {
    const source = { a: 1 };
    const incoming = { b: 2 };
    const result = mergeValues(source, incoming, () => 0);
    expect(result).toEqual({ b: 2 });
  });

  it('删除的时候，noDropKeys 不会被删除', () => {
    const source = { a: 1 };
    const incoming = { b: 2 };
    const result = mergeValues(source, incoming, () => 0, { noDropKeys: ['a'] });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('值合并', () => {
    const source = { a: 1 };
    const incoming = { a: 2 };
    const result = mergeValues(source, incoming, (s, i) => s + i);
    expect(result).toEqual({ a: 3 });
  });
});
