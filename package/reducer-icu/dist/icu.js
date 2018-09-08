"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const intl_messageformat_parser_1 = require("intl-messageformat-parser");
var TokenType;
(function (TokenType) {
    TokenType["messageFormatPattern"] = "messageFormatPattern";
    TokenType["messageTextElement"] = "messageTextElement";
    TokenType["argumentElement"] = "argumentElement";
    TokenType["selectFormat"] = "selectFormat";
    TokenType["optionalFormatPattern"] = "optionalFormatPattern";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
const builder = {
    [TokenType.messageFormatPattern]: (ast) => {
        return ast.elements
            .map(el => {
            return builder[el.type](el);
        })
            .join('');
    },
    [TokenType.messageTextElement]: (ast) => {
        return ast.value;
    },
    [TokenType.argumentElement]: (ast) => {
        if (ast.format) {
            return `{${ast.id}, ${builder[ast.format.type](ast.format)}}`;
        }
        return `{${ast.id}}`;
    },
    [TokenType.selectFormat]: (ast) => {
        return 'select, ' + ast.options.map(op => builder[op.type](op)).join(' ');
    },
    [TokenType.optionalFormatPattern]: (ast) => {
        return `${ast.selector}{${builder[ast.value.type](ast.value)}}`;
    },
};
function createArgumentElement(id, formatter) {
    return {
        type: TokenType.argumentElement,
        id,
        format: formatter,
    };
}
exports.createArgumentElement = createArgumentElement;
function createSelectFormat(options) {
    return {
        type: TokenType.selectFormat,
        offset: 0,
        options,
    };
}
exports.createSelectFormat = createSelectFormat;
function createOptionalFormatPattern(selector, value) {
    return {
        type: TokenType.optionalFormatPattern,
        selector,
        value,
    };
}
exports.createOptionalFormatPattern = createOptionalFormatPattern;
function createMessageFormatPattern(elements) {
    return {
        type: TokenType.messageFormatPattern,
        elements,
    };
}
exports.createMessageFormatPattern = createMessageFormatPattern;
function createMessageTextElement(value) {
    return {
        type: TokenType.messageTextElement,
        value,
    };
}
exports.createMessageTextElement = createMessageTextElement;
function parse(text) {
    return intl_messageformat_parser_1.default.parse(text);
}
exports.parse = parse;
function build(ast) {
    return builder[ast.type](ast);
}
exports.build = build;
function walk(ast, callback) {
    if (ast)
        callback(ast);
    else
        return;
    switch (ast.type) {
        case TokenType.messageFormatPattern:
            ast.elements.forEach(ele => walk(ele, callback));
            break;
        case TokenType.argumentElement:
            walk(ast.format, callback);
            break;
        case TokenType.selectFormat:
            ast.options.forEach(ele => walk(ele, callback));
            break;
        case TokenType.optionalFormatPattern:
            walk(ast.value, callback);
            break;
    }
}
exports.walk = walk;
