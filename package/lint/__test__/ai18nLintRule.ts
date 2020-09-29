import { WalkContext } from 'tslint';
import { walk } from '../lib/ai18nLintRule';
import * as ts from 'typescript';

const createLintCtx = (content: string) => {
  const options: ts.CompilerOptions = { jsx: ts.JsxEmit.None };
  const host = ts.createCompilerHost(options, true);
  host.readFile = () => content;

  const p = ts.createProgram(['mock.tsx'], options, host);
  const sourceFile = p.getSourceFile('mock.tsx')!;

  return new WalkContext<any>(sourceFile, 'x', undefined);
};

const inspectCtx = (ctx: WalkContext) => {
  const result = ctx.failures.map(f => {
    return [f.getFailure(), f.getFix()];
  });

  return result;
};

describe('ai18nLintRule', () => {
  it('jsx element', () => {
    const ctx = createLintCtx('const a = <div title="标题">苹果<span title="标签">{"香蕉"}</span></div>');
    walk(ctx);
    expect(inspectCtx(ctx)).toMatchSnapshot();
  });

  it('jsx StringLiteral', () => {
    const ctx = createLintCtx('const a = "苹果"');
    walk(ctx);
    expect(inspectCtx(ctx)).toMatchSnapshot();
  });

  it('跳过非全中文字符串', () => {
    const ctx = createLintCtx('const a = "苹果 xxx"');
    walk(ctx);
    expect(ctx.failures.length === 0);
  });

  it('跳过已被 __ 和 __define 包裹的', () => {
    const ctx = createLintCtx(`const a = __("苹果") + __define("香蕉") + foo("西瓜")`);
    walk(ctx);
    expect(inspectCtx(ctx)).toMatchSnapshot();
  });
});
