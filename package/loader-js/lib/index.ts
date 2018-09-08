import * as acorn from 'acorn-jsx';
import { Program, CallExpression, Literal, Identifier } from 'estree';
import walk from './walk';

export interface LoaderConfigType {}
export interface LoaderParseType {
  mark: {
    key: string;
    description?: string;
  };
}

class Loader {
  public config: LoaderConfigType;
  public ast: Program;

  constructor(config: LoaderConfigType = {}) {
    this.config = { plugins: { jsx: true }, ...config };
  }

  private parseCallExpression(node: CallExpression) {
    const calleeName = (node.callee as Identifier).name;
    // 提取 __() 和 __define() 定义的文案
    if (['__', '__define'].indexOf(calleeName) >= 0) {
      const args = node.arguments || [];
      if (args.length === 0) return;
      // 参数 0 必须是纯文本
      if (
        args[0].type === 'Literal' &&
        (args[0] as Literal).value &&
        typeof (args[0] as Literal).value === 'string'
      ) {
        const mark: LoaderParseType['mark'] = {
          key: (args[0] as Literal).value + '',
        };
        if (
          args[1] &&
          args[1].type === 'Literal' &&
          (args[1] as Literal).value &&
          typeof (args[1] as Literal).value === 'string'
        ) {
          mark.description = (args[1] as Literal).value as string;
        }
        return { mark };
      }
    }
  }

  parse(code: string): LoaderParseType[] {
    const markList: LoaderParseType[] = [];
    const ast = (this.ast = acorn.parse(code, this.config));
    walk.simple(ast, {
      CallExpression: node => {
        const r = this.parseCallExpression(node);
        if (r) markList.push(r);
      },
    });
    return markList;
  }
}

export default Loader;
