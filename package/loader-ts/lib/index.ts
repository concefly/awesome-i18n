import { walk } from './walk';
import * as ts from 'typescript';

export interface LoaderConfigType {}
export interface LoaderParseType {
  mark: {
    key: string;
    description?: string;
  };
}

class Loader {
  public config: LoaderConfigType;
  public ast: ts.SourceFile;

  constructor(config: LoaderConfigType = {}) {
    this.config = { plugins: { jsx: true }, ...config };
  }

  private parseCallExpression(node: ts.CallExpression): LoaderParseType {
    const method = node.expression.getText();
    if (['__', '__define'].indexOf(method) >= 0) {
      const [key, description] = node.arguments;
      // 只提取 key 为字符串字面量的 token
      const normalizedKey =
        key && ts.isStringLiteral(key) && key.getText().replace(/^"|^'|"$|'$/g, '');
      const normalizedDesc =
        description &&
        ts.isStringLiteral(description) &&
        description.getText().replace(/^"|^'|"$|'$/g, '');
      if (normalizedKey) {
        const re: LoaderParseType = {
          mark: {
            key: normalizedKey,
          },
        };
        if (normalizedDesc) {
          re.mark.description = normalizedDesc;
        }
        return re;
      }
    }
  }

  parse(code: string, filePath: string): LoaderParseType[] {
    const source = (this.ast = ts.createSourceFile(
      filePath,
      code,
      ts.ScriptTarget.ES2015,
      /*setParentNodes */ true
    ));

    const markList: LoaderParseType[] = [];

    walk(source, node => {
      if (ts.isCallExpression(node)) {
        const r = this.parseCallExpression(node);
        if (r) markList.push(r);
      }
    });

    return markList;
  }
}

export default Loader;
