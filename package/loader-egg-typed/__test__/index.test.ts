import Loader from '../lib';

test('normal', () => {
  const fixture = `
    BadRequestError('中文1');
    BadRequestError({ message: '中文2' });
  `;
  const loader = new Loader();
  const result = loader.parse(fixture, 'a.tsx');
  expect(result).toEqual([{ mark: { key: '中文1' } }, { mark: { key: '中文2' } }]);
});
