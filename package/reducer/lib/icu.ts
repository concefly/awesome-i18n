import parser from 'intl-messageformat-parser';

export enum TokenType {
  messageFormatPattern = 'messageFormatPattern',
  messageTextElement = 'messageTextElement',
  argumentElement = 'argumentElement',
  selectFormat = 'selectFormat',
  optionalFormatPattern = 'optionalFormatPattern',
}

export interface PatternBase {
  type: TokenType;
  location?: {
    start: { offset: number; line: number; column: number };
    end: { offset: number; line: number; column: number };
  };
}

export interface MessageFormatPattern extends PatternBase {
  type: TokenType.messageFormatPattern;
  elements: PatternBase[];
}

export interface MessageTextElement extends PatternBase {
  type: TokenType.messageTextElement;
  value: string;
}

export interface OptionalFormatPattern extends PatternBase {
  type: TokenType.optionalFormatPattern;
  selector: string;
  value: MessageFormatPattern;
}

export interface selectFormat extends PatternBase {
  type: TokenType.selectFormat;
  offset: number;
  options: OptionalFormatPattern[];
}

export interface ArgumentElement extends PatternBase {
  type: TokenType.argumentElement;
  id: string;
  format?: selectFormat;
}

const builder: { [key: string]: Function } = {
  [TokenType.messageFormatPattern]: (ast: MessageFormatPattern): string => {
    return ast.elements
      .map(el => {
        return builder[el.type](el);
      })
      .join('');
  },
  [TokenType.messageTextElement]: (ast: MessageTextElement): string => {
    return ast.value;
  },
  [TokenType.argumentElement]: (ast: ArgumentElement): string => {
    if (ast.format) {
      return `{${ast.id}, ${builder[ast.format.type](ast.format)}}`;
    }
    return `{${ast.id}}`;
  },
  [TokenType.selectFormat]: (ast: selectFormat): string => {
    return 'select, ' + ast.options.map(op => builder[op.type](op)).join(' ');
  },
  [TokenType.optionalFormatPattern]: (ast: OptionalFormatPattern): string => {
    return `${ast.selector}{${builder[ast.value.type](ast.value)}}`;
  },
};

export function createArgumentElement(id: string, formatter?: selectFormat): ArgumentElement {
  return {
    type: TokenType.argumentElement,
    id,
    format: formatter,
  };
}

export function createSelectFormat(options: OptionalFormatPattern[]): selectFormat {
  return {
    type: TokenType.selectFormat,
    offset: 0,
    options,
  };
}

export function createOptionalFormatPattern(
  selector: string,
  value: MessageFormatPattern
): OptionalFormatPattern {
  return {
    type: TokenType.optionalFormatPattern,
    selector,
    value,
  };
}

export function createMessageFormatPattern(elements: PatternBase[]): MessageFormatPattern {
  return {
    type: TokenType.messageFormatPattern,
    elements,
  };
}

export function createMessageTextElement(value: string): MessageTextElement {
  return {
    type: TokenType.messageTextElement,
    value,
  };
}

export function parse(text: string): MessageFormatPattern {
  return parser.parse(text);
}

export function build(ast: PatternBase): string {
  return (builder as any)[ast.type](ast);
}

export function walk(ast: PatternBase, callback: (node: PatternBase) => void) {
  if (ast) callback(ast);
  else return;
  switch (ast.type) {
    case TokenType.messageFormatPattern:
      (ast as MessageFormatPattern).elements.forEach(ele => walk(ele, callback));
      break;
    case TokenType.argumentElement:
      walk((ast as ArgumentElement).format, callback);
      break;
    case TokenType.selectFormat:
      (ast as selectFormat).options.forEach(ele => walk(ele, callback));
      break;
    case TokenType.optionalFormatPattern:
      walk((ast as OptionalFormatPattern).value, callback);
      break;
  }
}
