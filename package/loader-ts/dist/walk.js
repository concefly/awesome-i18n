"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = void 0;
const ts = require("typescript");
function walk(node, callback) {
    ts.forEachChild(node, child => {
        callback(child);
        walk(child, callback);
    });
}
exports.walk = walk;
