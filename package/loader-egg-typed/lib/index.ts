import { walk } from './walk';
import * as ts from 'typescript';

export interface LoaderConfigType {}
export interface LoaderParseType {
  mark: {
    key: string;
    description?: string;
  };
}

export const METHOD_LIST = [
  'BadRequestError',
  'ForbiddenError',
  'ServerError',
  'NotFoundError',
  'UnauthorizedError',
];

class Loader {
  public config: LoaderConfigType;
  public ast: ts.SourceFile;

  constructor(config: LoaderConfigType = {}) {
    this.config = { plugins: { jsx: true }, ...config };
  }

  private parseCallExpression(node: ts.CallExpression): LoaderParseType {
    const method = node.expression.getText();
    if (METHOD_LIST.indexOf(method) >= 0) {
      const [arg1] = node.arguments;

      // 形如： BadRequestError('非法请求')
      if (arg1 && ts.isStringLiteral(arg1)) {
        return {
          mark: {
            key: arg1.getText().replace(/^"|^'|"$|'$/g, ''),
          },
        };
      }

      // 形如： BadRequestError({ code: -1, message: '需要人机验证', type: 'afs' });
      if (arg1 && ts.isObjectLiteralExpression(arg1)) {
        const messageProperty = arg1.properties.find(
          p =>
            ts.isPropertyAssignment(p) &&
            ts.isIdentifier(p.name) &&
            p.name.getText() === 'message' &&
            ts.isStringLiteral(p.initializer)
        );
        if (messageProperty && ts.isPropertyAssignment(messageProperty)) {
          return {
            mark: {
              key: messageProperty.initializer.getText().replace(/^"|^'|"$|'$/g, ''),
            },
          };
        }
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
