"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const walk_1 = require("./walk");
const ts = require("typescript");
const ai18n_type_1 = require("ai18n-type");
class Loader extends ai18n_type_1.BaseLoader {
    /** 解析函数表达式 */
    parseCallExpression(node) {
        const method = node.expression.getText();
        if (['__', '__define'].indexOf(method) >= 0) {
            const [key, description] = node.arguments;
            // 只提取 key 为字符串字面量的 token
            const nKey = key && ts.isStringLiteral(key) && key.getText().replace(/^"|^'|"$|'$/g, '');
            if (!nKey)
                return;
            const nDesc = description &&
                ts.isStringLiteral(description) &&
                description.getText().replace(/^"|^'|"$|'$/g, '');
            return new ai18n_type_1.LoadResultItem(nKey, nDesc || undefined);
        }
    }
    parse(code, filePath) {
        const source = ts.createSourceFile(filePath, code, ts.ScriptTarget.ESNext, 
        /*setParentNodes */ true);
        const result = new ai18n_type_1.LoadResult([]);
        walk_1.walk(source, node => {
            if (ts.isCallExpression(node)) {
                const r = this.parseCallExpression(node);
                if (r)
                    result.add(r);
            }
        });
        return result;
    }
}
exports.default = Loader;
