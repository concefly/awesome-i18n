import * as ts from 'typescript';
import * as Lint from 'tslint';
import * as path from 'path';

/** 中文正则 */
const cnReg = /^[\u4e00-\u9fa5]+$/;

export function walk(ctx: Lint.WalkContext<void>) {
  // 跳过非 tsx 文件
  if (!ctx.sourceFile.fileName.endsWith('tsx')) return;

  // 检查 jsx 里的中文字面量
  const visitStringLiteral = (n: ts.StringLiteral) => {
    const text = n.text;
    if (!text.match(cnReg)) return;

    if (
      ts.isCallExpression(n.parent) &&
      ['__', '__define'].includes(n.parent.expression.getText())
    ) {
      // 跳过 __ 和 __define
      return;
    }

    if (ts.isJsxAttribute(n.parent)) {
      // 跳过 jsx attr 里的
      return;
    }

    const fix = new Lint.Replacement(n.getStart(), n.getWidth(), `__('${text.trim()}')`);
    ctx.addFailureAtNode(n, `"${text.trim()}" 未做国际化处理`, fix);
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
    const ignores = options.ruleArguments[0]?.ignores as string[];
    const absIgnores: string[] = ignores.map(p => p.toLowerCase());
    const filename = sourceFile.fileName.toLowerCase();

    if (absIgnores.some(ignore => filename.includes(ignore))) return [];
    return this.applyWithFunction(sourceFile, walk);
  }
}
