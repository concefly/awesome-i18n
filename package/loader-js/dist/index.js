"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const walk_1 = require("./walk");
const acorn_1 = require("acorn");
const acornJsx = require("acorn-jsx");
const Parser = acorn_1.Parser.extend(acornJsx(acorn_1.Parser));
class Loader {
    constructor(config = {}) {
        this.config = Object.assign({ plugins: { jsx: true } }, config);
    }
    parseCallExpression(node) {
        const calleeName = node.callee.name;
        // 提取 __() 和 __define() 定义的文案
        if (['__', '__define'].indexOf(calleeName) >= 0) {
            const args = node.arguments || [];
            if (args.length === 0)
                return;
            // 参数 0 必须是纯文本
            if (args[0].type === 'Literal' &&
                args[0].value &&
                typeof args[0].value === 'string') {
                const mark = {
                    key: args[0].value + '',
                };
                if (args[1] &&
                    args[1].type === 'Literal' &&
                    args[1].value &&
                    typeof args[1].value === 'string') {
                    mark.description = args[1].value;
                }
                return { mark };
            }
        }
    }
    parse(code) {
        const markList = [];
        const ast = (this.ast = new Parser(Loader.PARSER_CONFIG, code).parse());
        walk_1.default.simple(ast, {
            CallExpression: node => {
                const r = this.parseCallExpression(node);
                if (r)
                    markList.push(r);
            },
        });
        return markList;
    }
}
Loader.PARSER_CONFIG = {
    sourceType: 'module',
    ecmaVersion: 2019,
};
exports.default = Loader;
