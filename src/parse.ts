import {
  AttributeNode,
  NodeTypes,
  Node,
  TextNode,
  TemplateChildNode,
  Position,
  SourceLocation,
  createRoot,
} from './ast';

type AttributeValue =
  | {
      content: string;
      loc: SourceLocation;
    }
  | undefined;

// const extend = Object.assign;
const isArray = Array.isArray;
export interface ParserOptions {}

export interface ParserContext {
  options: ParserOptions;
  readonly originalSource: string;
  source: string;
  offset: number;
  line: number;
  column: number;
}

// const lineEndRE = /[\r\n]$/
// const spacesRE = /^[\t\r\n\f ]+/;

function createParserContext(
  content: string,
  rawOptions: ParserOptions
): ParserContext {
  return {
    options: rawOptions,
    column: 1,
    line: 1,
    offset: 0,
    originalSource: content,
    source: content,
  };
}

export function baseParse(content: string, options: ParserOptions = {}) {
  const context = createParserContext(content, options);
  return createRoot(parseChildren(context, []));
}

function parseChildren(
  context: ParserContext,
  ancestors: Node[]
): TemplateChildNode {
  const parent = last(ancestors);
  const nodes: TemplateChildNode[] = [];

  log(`[parseChildren] --------------------------------------- START`);
  log({ parent, ancestors });

  while (context.source) {
    const s = context.source;
    let node: TemplateChildNode | TemplateChildNode[] | undefined = undefined;

    if (s[0] === '#') {
      if (s.length === 1) {
        // error
      } else if (s[1] === '+') {
        // #+ ATTRIBUTE
        node = parseAttribute(context);
      }
    }

    if (!node) {
      node = parseText(context);
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode(nodes, node[i]);
      }
    } else {
      pushNode(nodes, node);
    }
  }

  log(`[parseChildren] --------------------------------------- END`);
  return nodes.filter(Boolean);
}

function pushNode(nodes: TemplateChildNode[], node: TemplateChildNode): void {
  if (node.type === NodeTypes.TEXT) {
    const prev = last(nodes);
    // 去掉只有空格或换行符的节点
    if (node.content.trim() === '') {
      return
    }
    if (prev && prev.type === NodeTypes.TEXT) {
      prev.content += node.content;
      return;
    }
  }
  nodes.push(node);
}

/**
 * 解析 #+title: name 类型
 * @param {ParserContext} context
 * @returns {AttributeNode} 
 */
function parseAttribute(context: ParserContext): AttributeNode {
  const start = getCursor(context);

  // #+author
  const match = /([\w_]+):/.exec(context.source)!;
  const name = match[1];

  advanceBy(context, name.length + 3); // #+ and :

  let value: AttributeValue = parseAttributeValue(context);
  const loc = getSelection(context, start);

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: value.loc,
    },
    loc,
  };
}

function parseAttributeValue(context: ParserContext): AttributeValue {
  const start = getCursor(context);
  let content: string;

  const endIndex = context.source.indexOf('\n');
  content = parseTextData(context, endIndex);

  return { content, loc: getSelection(context, start) };
}

function parseText(context: ParserContext): TextNode {
  const endTokens = ['#', '*', '/', '_', '~', '='];

  let endIndex = context.source.length;

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const start = getCursor(context);
  const content = parseTextData(context, endIndex);
  console.log({ endIndex, content });

  return {
    type: NodeTypes.TEXT,
    content,
    loc: getSelection(context, start),
  };
}

function parseTextData(context: ParserContext, length: number): string {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  return rawText;
}

function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}

// function startsWith(source: string, searchString: string): boolean {
//   return source.startsWith(searchString);
// }

function advanceBy(context: ParserContext, numberOfCharacters: number): void {
  const { source } = context;
  console.log(context, 'before')
  advancePositionWithMutation(context, source, numberOfCharacters)
  console.log(context, 'after')
  context.source = source.slice(numberOfCharacters);
}

// function advanceSpaces(context: ParserContext): void {
//   const match = spacesRE.exec(context.source);
//   if (match) {
//     advanceBy(context, match[0].length);
//   }
// }

// function getNewPosition(
//   context: ParserContext,
//   start: Position,
//   numberOfCharacters: number
// ): Position {
//   return advancePositionWithClone(
//     start,
//     context.originalSource.slice(start.offset, numberOfCharacters),
//     numberOfCharacters
//   );
// }

function getCursor(context: ParserContext): Position {
  const { column, line, offset } = context;
  return { column, line, offset };
}

function getSelection(
  context: ParserContext,
  start: Position,
  end?: Position
): SourceLocation {
  end = end || getCursor(context);
  return {
    start,
    end,
    source: context.originalSource.slice(start.offset, end.offset),
  };
}

// function advancePositionWithClone(
//   pos: Position,
//   source: string,
//   numberOfCharacters: number = source.length
// ): Position {
//   return advancePositionWithMutation(
//     extend({}, pos),
//     source,
//     numberOfCharacters
//   );
// }

// advance by mutation without cloning (for performance reasons), since this
// gets called a lot in the parser
export function advancePositionWithMutation(
  pos: Position,
  source: string,
  numberOfCharacters: number = source.length
): Position {
  let linesCount = 0;
  let lastNewLinePos = -1;
  for (let i = 0; i < numberOfCharacters; i++) {
    if (source.charCodeAt(i) === 10 /* newline char code */) {
      linesCount++;
      lastNewLinePos = i;
    }
  }

  pos.offset += numberOfCharacters;
  pos.line += linesCount;
  pos.column =
    lastNewLinePos === -1
      ? pos.column + numberOfCharacters
      : numberOfCharacters - lastNewLinePos;

  return pos;
}

function log(msg: any) {
  if (isArray(msg)) {
    msg.forEach(console.log);
  } else {
    console.log(msg);
  }
}
