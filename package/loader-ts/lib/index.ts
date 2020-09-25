import { walk } from "./walk";
import * as ts from "typescript";
import { LoadResult, LoadResultItem, BaseLoader } from "ai18n-type";

export default class Loader extends BaseLoader {
  /** 解析函数表达式 */
  private parseCallExpression(
    node: ts.CallExpression
  ): LoadResultItem | undefined {
    const method = node.expression.getText();

    if (["__", "__define"].indexOf(method) >= 0) {
      const [key, description] = node.arguments;

      // 只提取 key 为字符串字面量的 token
      const nKey =
        key &&
        ts.isStringLiteral(key) &&
        key.getText().replace(/^"|^'|"$|'$/g, "");
      if (!nKey) return;

      const nDesc =
        description &&
        ts.isStringLiteral(description) &&
        description.getText().replace(/^"|^'|"$|'$/g, "");

      return new LoadResultItem(nKey, nDesc || undefined);
    }
  }

  parse(code: string, filePath: string): LoadResult {
    const source = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.ESNext,
      /*setParentNodes */ true
    );

    const result = new LoadResult([]);

    walk(source, (node) => {
      if (ts.isCallExpression(node)) {
        const r = this.parseCallExpression(node);
        if (r) result.add(r);
      }
    });

    return result;
  }
}
