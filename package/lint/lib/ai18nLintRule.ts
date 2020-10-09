import * as ts from 'typescript';
import * as Lint from 'tslint';
import { cnReg } from 'ai18n-type';

export interface IOptions {
  ignores?: string[];
  forces?: string[];
}

export function walk(ctx: Lint.WalkContext<void>) {
  // 跳过非 tsx 文件
  if (!ctx.sourceFile.fileName.endsWith('tsx')) return;

  // 检查 jsx 里的中文字面量
  const visitStringLiteral = (n: ts.StringLiteral) => {
    let text = n.text;
    if (!text.match(cnReg)) return;

    const parent = n.parent;
    if (
      ts.isCallExpression(parent) &&
      ['__', '__define'].indexOf(parent.expression.getText()) >= 0
    ) {
      // 跳过 __ 和 __define
      return;
    }

    text = text.trim();

    if (ts.isJsxAttribute(n.parent)) {
      // jsx attr 里的，形如 <div id="西瓜" />
      const fix = new Lint.Replacement(n.getStart(), n.getWidth(), `{__('${text}')}`);
      ctx.addFailureAtNode(n, `"${text}" 未做国际化处理`, fix);
      return;
    }

    const fix = new Lint.Replacement(n.getStart(), n.getWidth(), `__('${text}')`);
    ctx.addFailureAtNode(n, `"${text}" 未做国际化处理`, fix);
  };

  // 检查 <div>中文</div> 这种
  const visitJsxText = (n: ts.JsxText) => {
    const text = n.getText();
    if (!text || !cnReg.test(text)) return;

    const fix = new Lint.Replacement(n.getStart(), n.getWidth(), `{ __('${text.trim()}') }`);
    ctx.addFailureAtNode(n, `"${text.trim()}" 未做国际化处理`, fix);
  };

  const visitNode = (n: ts.Node) => {
    if (ts.isJsxText(n)) visitJsxText(n);
    if (ts.isStringLiteral(n)) visitStringLiteral(n);
    else walkChildren(n);
  };

  const walkChildren = (n: ts.Node) => ts.forEachChild(n, visitNode);
  walkChildren(ctx.sourceFile);
}

export class Rule extends Lint.Rules.AbstractRule {
  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    const options = this.getOptions();
    const { ignores = [], forces = [] } = options.ruleArguments[0] as IOptions;

    const isInIgnoreList = ignores.some(k => sourceFile.fileName.includes(k));
    const isInForceList = forces.some(k => sourceFile.fileName.includes(k));

    const shouldIgnore = isInIgnoreList && !isInForceList;
    if (shouldIgnore) return [];

    return this.applyWithFunction(sourceFile, walk);
  }
}
