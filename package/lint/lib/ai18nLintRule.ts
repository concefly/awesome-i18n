import * as ts from 'typescript';
import * as Lint from 'tslint';
import * as path from 'path';

function walk(ctx: Lint.WalkContext<void>) {
  // 检查 <div>中文</div> 这种
  const checkInJsxText = (node: ts.JsxElement) => {
    node.children.forEach(c => {
      if (ts.isJsxText(c)) {
        const text = c.getText();
        if (!text || !/[\u4e00-\u9fa5]/.test(text)) {
          return;
        }
        const fix = new Lint.Replacement(c.getStart(), c.getWidth(), `{ __('${text.trim()}') }`);
        ctx.addFailureAtNode(c, `"${text.trim()}" 未做国际化处理`, fix);
      }
    });
  };

  // 检查 <div>{"中文"}</div> 这种
  const checkInJsxExpressionText = (node: ts.JsxElement) => {
    node.children.forEach(c => {
      if (ts.isJsxExpression(c) && c.expression && ts.isStringLiteral(c.expression)) {
        const text = c.expression.getText();
        if (!text || !/[\u4e00-\u9fa5]/.test(text)) return;
        ctx.addFailureAtNode(c, `"${text.trim()}" 未做国际化处理`);
      }
    });
  };

  const visitJsxElement = (n: ts.JsxElement) => {
    checkInJsxText(n);
    checkInJsxExpressionText(n);
    walkChildren(n);
  };

  const visitNode = (n: ts.Node) => {
    if (ts.isJsxElement(n)) visitJsxElement(n);
    else walkChildren(n);
  };

  const walkChildren = (n: ts.Node) => ts.forEachChild(n, visitNode);
  walkChildren(ctx.sourceFile);
}

export class Rule extends Lint.Rules.AbstractRule {
  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    const options = this.getOptions();
    const ignores = options.ruleArguments[0]?.ignores as string[];
    const absIgnores: string[] = ignores.map(p => path.resolve(p));
    const filename = sourceFile.fileName;

    if (absIgnores.some(ignore => filename.indexOf(ignore) === 0)) return [];
    return this.applyWithFunction(sourceFile, walk);
  }
}
