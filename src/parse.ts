export const isArray = Array.isArray;

export interface ParserOptions {
  onError: (error: Error) => void;
}

export const enum NodeTypes {
  ROOT, // 根节点
  TEXT, // pure text
  PROPERTY, // #+...
  HEADER, // ** ...
  BLOCK, // #+begin...#+end
  EMPHASIS, // =,_,/,+,$
  LIST, // - [-], 1. ...

  // 各称链接
  EXTERNAL_LINK, // [[url][name]]
  INNER_LINK, // <<meta_id>>
}

export interface RootNode {
  metas: Attribute[]; // 页面头部所有属性
  children: any[];
  footnotes: FootNode[]; // 脚注节点gs./l
  // TODO more...
}

export interface Node {
  type: NodeTypes;
  content: string;
  indent: number;
  index: number;
  children?: any[];
  tags?: string[];
}

export interface FootNode {
  name: string;
  value: string;
}

export interface TextNode extends Node {
  type: NodeTypes.TEXT;
}

export interface PropertyNode extends Node {
  type: NodeTypes.PROPERTY;
  name: string;
  value: string;
}

export interface HeaderNode extends Node {
  type: NodeTypes.HEADER;
  title: string;
  level: number;
}

export interface Attribute {
  name: string;
  value: string;
}

export interface ExternalLinkNode extends Node {
  type: NodeTypes.EXTERNAL_LINK;
  content: string;
  url: string;
  description?: string;
}

export interface InnerLinkNode extends Node {
  type: NodeTypes.INNER_LINK;
  content: string;
  id: string;
}

export interface BlockNode extends Node {
  type: NodeTypes.BLOCK;
  name: string;
  language: string;
  content: string;
  code: string;
  indent: number;
  attributes: Array<Attribute>;
  options: BlockOptions;
}

export type BlockOptions = Array<Attribute>;

export const enum DoStatus {
  DONE,
  DOING,
  WAITING,
  CANCELLED,
  SCHEDULED,
}
export interface ListNode extends Node {
  type: NodeTypes.LIST;
  content: string;
  isOrder: boolean;
  status: DoStatus;
}

export const inlineTagList = ['=', '+', '_', '/', '~', '*', '$'];
export type InlineTag = '=' | '+' | '_' | '/' | '~' | '*' | '$';

export interface EmphasisNode extends Node {
  type: NodeTypes.EMPHASIS;
  tag: InlineTag;
  children: EmphasisNode[];
}

export type ValidContentNode =
  | TextNode
  | ExternalLinkNode
  | InnerLinkNode
  | EmphasisNode;

export const propertyRE = /^(\s*)#\+(?!begin|end)([\w-_]+)\s*:(.*)$/i;
export const headerRE = /^(\*+)\s+(.*)$/i;
export const blockRE =
  /^(\s*)#\+begin_([\w-]+)\s+([\w-]+)\s+(:[^\n]+\n)\s*(.*)#\+end_(\2)/i;
export const blockBeginRE = /^(\s*)#\+begin_([\w-]+)(\s+[\w-]+)?(\s+.*)?/;
export const blockEndRE = /^(\s*)#\+end_([\w-]+)$/;
export const blockOptionsRE = /-(\w)\s([^-]+)?/gi;
export const unorderListRE = /^(\s*)(?:-|\+|\s\*)\s+(\[[-x ]\]]\s+)?(.*)$/;
export const orderListRE = /^(\s*)(?:\d+)(?:\.|\))\s+(\[[-x ]\]]\s+)?(.*)$/;
export const extLinkRE = /\[\[([^[\]]+)](?:\[([^[\]]+)])?\]/g;
export const innerLinkRE = /<<([^<>]+)>>/g;
export const emphasisRE = /([=~\+_/\$])(?=[^\s])([^\1]+?\S)(?:\1)/g;

export function baseParse(
  source: string,
  options: ParserOptions = {
    onError: (error: Error) => console.warn(error),
  }
) {
  const list = source.split(/\n+/); //.map(row => row.replace(/^[\s\t\f\r\n]+/g, ''))

  options;
  list;

  const nodes: any = [];

  for (let i = 0; i < list.length; i++) {
    const node = parseNode(list[i], list, i);
    if (node) {
      nodes.push(node);
    }
  }
  return nodes;
}

export function parseNode(content: string, list: string[], index: number) {
  let node: any;

  if (blockBeginRE.test(content)) {
    node = parseBlock(content, list, index);
  } else if (propertyRE.test(content)) {
    node = parseProperty(content, index);
  } else if (headerRE.test(content)) {
    node = parseHeader(content, index);
  }

  if (!node) {
    node = parseText(content, index);
  }

  return node;
}

export function parseBlock(
  content: string,
  list: string[],
  index: number
): BlockNode | null {
  const matched = blockBeginRE.exec(content);

  if (matched == null) {
    return null;
  }

  let i;
  // find nearest end block
  for (i = index + 1; i < list.length; i++) {
    const next = list[i];
    if (next && next.match(blockEndRE)) {
      break;
    }
  }

  // no end block
  if (i === list.length) {
    throw new TypeError(`[parseBlock] content=${content}, no end block.`);
  }

  let attr = matched[4] || '';
  // find the first `:` index
  let optionEndIndex = attr.indexOf(':');
  let options = [] as BlockOptions,
    optionString = '';

  // parse #+begin_src emacs-lisp -n -r -> `-n -r`
  if (optionEndIndex > 0) {
    optionString = attr.slice(0, optionEndIndex);
    attr = attr.slice(optionEndIndex);
    options = (parseCLIOption(optionString) || []) as BlockOptions;
  }

  const language = (matched[3] || '').trim();
  const name = (matched[2] || '').trim();
  const node = {
    type: NodeTypes.BLOCK,
    name,
    language,
    content,
    code: list.slice(index + 1, i).join('\n'),
    indent: matched[1].length,
    attributes: attr
      ? (' ' + attr)
          .split(/\s+:/)
          .filter(Boolean)
          .map((item: string) => {
            const [name, value = ''] = item.split(/\s+/);
            if (name && value) {
              return { name: name.trim(), value: value.trim() };
            }
            
            return null
          })
          .filter(Boolean)
      : [],
    options,
    index,
  };

  // remove code from original list
  list.splice(index + 1, i - index);

  return node as BlockNode;
}

function parseCLIOption(str: string): BlockOptions {
  // add space word
  str = ` ${str} `;

  let result,
    nodes = [];
  while ((result = blockOptionsRE.exec(str))) {
    const [, name, value = ''] = result;
    if (name) {
      nodes.push({ name: name.trim(), value: (value || '').trim() });
    }
  }

  return nodes;
}

export function parseHeader(source: string, index: number): HeaderNode | null {
  const { content, tags } = parseTags(source);

  const matched = content.match(headerRE);

  if (matched == null) {
    return null;
  }

  const [text, stars, title] = matched;

  return {
    type: NodeTypes.HEADER,
    content: text,
    title,
    index,
    indent: 0,
    tags,
    level: stars.length,
  };
}

/**
 * 解析文中出现的 `#+title: title content`
 * @param {string} content
 * @param {number} index
 * @returns
 */
export function parseProperty(
  content: string,
  index: number
): PropertyNode | null {
  const matched = content.match(propertyRE);
  if (matched) {
    const [content, indent, name, value] = matched || [];
    return {
      type: NodeTypes.PROPERTY,
      content,
      indent: (indent || '').length,
      name,
      value,
      index,
    };
  }

  return null;
}

// 解析文本
export function parseText(content: string, index: number): TextNode {
  const matched = content.match(/^(\s+)/);
  let indent = 0;
  if (matched) {
    indent = matched[1].length;
  }

  const node: TextNode = {
    type: NodeTypes.TEXT,
    content: content.trim(),
    children: [],
    indent,
    index,
  };

  // 将内容解析成 children，content 置空
  return parseEmphasisText(node);
}

/**
 * 解析正文中的特殊文本
 * 如：~code~, =code=, +删除线+, _下划线_, *加粗*, $latex$, 或可自定义。
 * @params {TextNode} parent 正文解析出来的节点挂到文本节点上去
 * @return {TextNode}
 */
export function parseEmphasisText(parent: TextNode): TextNode {
  let source = parent.content;

  if (!source) return parent;
  const children = [];

  let result,
    cursor = 0;
  while ((result = emphasisRE.exec(source))) {
    // eg. content: ~bala bala~, sign = "~", value = "bala bala"
    const [matchText, sign, matchValue] = result;

    const pureText = source.slice(cursor, result.index);

    // left text node
    children.push({
      type: NodeTypes.TEXT,
      content: pureText,
    });

    // emphasis node
    children.push({
      type: NodeTypes.EMPHASIS,
      tag: sign,
      content: matchValue,
    });

    // 保留上次遍历的游标位置，主要用来切割纯文本
    cursor = result.index + matchText.length;
  }

  // 最后的文本
  if (source) {
    children.push({
      type: NodeTypes.TEXT,
      content: source,
    });
  }

  parent.children = children;

  return parent;
}

function parseTags(content: string): {
  content: string;
  tags: string[];
} {
  const tagRE = /:(.*):/gi;
  let matched: string[] | null = null;
  let tags: string[] = [];
  if (content == '') {
    matched = null;
  } else if ((matched = content.match(tagRE))) {
    const value = matched[0];
    // remove matched tags from header
    content = content.replace(value, '');
    tags = value.replace(/^:|:$/, '').split(':').filter(Boolean);
  }

  return {
    tags,
    content,
  };
}
