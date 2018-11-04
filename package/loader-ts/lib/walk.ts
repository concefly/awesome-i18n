import * as ts from 'typescript';

export function walk(node: ts.Node, callback: (n: ts.Node) => void) {
  ts.forEachChild(node, child => {
    callback(child);
    walk(child, callback);
  });
}
