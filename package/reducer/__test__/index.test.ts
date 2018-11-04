import Reducer from '../lib';

describe('extract', () => {
  test('普通动态文本', () => {
    const fixture = {
      中文: 'abc {name}',
    };
    const result = new Reducer().extract(fixture);
    expect(result).toEqual([{ key: '中文', message: 'abc {name}' }]);
  });
  test('上下文动态文本', () => {
    const fixture = {
      中文: '{ description, select, a{1} b{hello {name}} other{2} }',
    };
    const result = new Reducer().extract(fixture);
    expect(result).toEqual([
      { key: '中文', description: 'a', message: '1' },
      { key: '中文', description: 'b', message: 'hello {name}' },
      { key: '中文', description: 'other', message: '2' },
    ]);
  });
});

describe('reduce', () => {
  test('新增 & 删除', () => {
    const result = new Reducer().reduce([{ key: '中文2 {title}' }], [{ key: '中文1' }]);
    expect(result).toEqual({
      '中文2 {title}': { message: '中文2 {title}', keywords: ['中文2 {title}'] },
    });
  });

  test('冲突合并 - 原样带入 srcMessage', () => {
    const result = new Reducer().reduce(
      [{ key: '中文1' }],
      [{ key: '中文1', message: 'hello {name}' }]
    );
    expect(result).toEqual({
      中文1: { message: 'hello {name}', keywords: [] },
    });
  });

  test('冲突合并 - 原样带入 srcMessage 的时候，新文案有上下文', () => {
    const result = new Reducer().reduce(
      [{ key: '中文1', description: 'ddd' }],
      [{ key: '中文1', message: 'hello {name}' }]
    );
    expect(result).toEqual({
      中文1: { message: '{description, select, ddd{中文1} other{hello {name}}}', keywords: ['中文1'] },
    });
  });

  test('冲突合并 - 新增上下文 & 删除源文件中不再使用的上下文', () => {
    const result = new Reducer().reduce(
      [{ key: '中文1', description: 'b' }, { key: '中文1', description: 'c' }],
      [
        { key: '中文1', description: 'a', message: 'ma' },
        { key: '中文1', description: 'b', message: 'mb' },
      ]
    );
    expect(result).toEqual({
      中文1: { message: '{description, select, b{mb} c{中文1}}', keywords: ['中文1'] },
    });
  });

});
