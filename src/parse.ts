export const isArray = Array.isArray;

export interface ParserOptions {
  onError: (error: Error) => void;
}

export const enum NodeTypes {
  ROOT, // 根节点
  TEXT, // pure text
  PROPERTY, // #+...
  HEADER, // ** ...
  HEADER_PROPERTIES,
  BLOCK, // #+begin...#+end
  TEXT_BLOCK, // non-src blocks, eg. example, textbox
  EMPHASIS, // =,_,/,+,$,[!&%@]{2}
  LIST, // - [-], 1. ...
  TIMESTAMP, // <2022-11-12 Wed 12:00>

  // 各称链接
  EXTERNAL_LINK, // [[url][name]]
  INNER_LINK, // <<meta_id>>

  STATE, // TODO, DONE, etc.
}

export interface RootNode {
  metas: Attribute[]; // 页面头部所有属性
  children: any[];
  footnotes: FootNode[]; // 脚注节点gs./l
  // TODO more...
}

export interface Node {
  type: NodeTypes;
  content: string | TextNode;
  indent: number;
  index: number;
  children?: any[];
  tags?: string[];
}

export interface StateNode {
  type: NodeTypes.STATE;
  content: 'TODO' | 'DONE' | 'CANCELLED';
}

export interface PairNode<T> {
  name: string;
  value: T;
}

export interface FootNode extends PairNode<string> {}
export interface TextNode extends Node {
  type: NodeTypes.TEXT;
}

interface Timestamp {
  year: string;
  month: string;
  day: string;
  week?: string;
  time?: string;
  dein?: string; // [+-]\d[wdmy], per month/day/week/year date
}
export interface TimestampNode extends Node {
  type: NodeTypes.TIMESTAMP;
  timestamp: Timestamp;
  value: string;
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
  properties: Array<{ name: string; value: string | Timestamp }>;
}

export interface Attribute extends PairNode<string> {}

export interface ExternalLinkNode extends Node {
  type: NodeTypes.EXTERNAL_LINK;
  content: string;
  url: string;
  description?: string;
  abbrev?: string; // [[url:abbrev][description]]
}

export interface InnerLinkNode extends Node {
  type: NodeTypes.INNER_LINK;
  content: string;
  id: string;
}

export interface BlockNode extends Node {
  type: NodeTypes.BLOCK | NodeTypes.TEXT_BLOCK;
  name: string;
  language: string;
  content: string;
  code: TextNode | string;
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
  state: ListItemState;
  tag: string;
}

export const inlineTagList = ['=', '+', '_', '/', '~', '*', '$'];
export type InlineTag = '=' | '+' | '_' | '/' | '~' | '*' | '$';
export const textBlockNames = ['example', 'textbox']; // non-src blocks name

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
export const unorderListRE = /^(\s*)(?:-|\+|\s\*)\s+(\[[-x ]\]\s+)?(.*)$/;
export const orderListRE = /^(\s*)(?:\d+)(?:\.|\))\s+(\[[-x ]\]\s+)?(.*)$/;
export const extLinkRE = /\[\[([^[\]]+)](\[([^[\]]+)])?\]/g;
export const innerLinkRE = /<<([^<>]+)>>/g;
export const emphasisRE =
  /([=~\+_/\$]|[!&%@][!&%@])(?=[^\s])([^\1]+?\S)(?:\1)/g;
export const timestampRE = /\<(\d{4}-\d{2}-\d{2}\s+[^>]+)>/gi; // check timestamp re
export const deadlineRE = /^\s*DEADLINE:(.*)/i;

const states: Array<StateNode['content']> = ['TODO', 'DONE', 'CANCELLED'];
export const stateRE = new RegExp(`(${states.join('|')})`, 'g');

export function baseParse(
  source: string,
  options: ParserOptions = {
    onError: (error: Error) => console.warn(error),
  }
) {
  const list = source.split(/\n+/);

  options;
  list;

  let nodes: any = [];

  for (let i = 0; i < list.length; i++) {
    const node = parseNode(list[i], list, i);
    if (node) {
      nodes.push(node);
    }
  }

  // filter the empty string node
  return nodes.filter((node: any) => node && node.content !== '');
}

export function parseNode(content: string, list: string[], index: number) {
  let node: any;

  if (blockBeginRE.test(content)) {
    node = parseBlock(content, index, list);
  } else if (propertyRE.test(content)) {
    node = parseProperty(content, index);
  } else if (headerRE.test(content)) {
    node = parseHeader(content, index, list);
  } else if (unorderListRE.test(content)) {
    node = parseList(content, index, list, false);
  } else if (orderListRE.test(content)) {
    node = parseList(content, index, list, true);
  }

  if (!node) {
    node = parseText(content, index);
  }

  return node;
}

export declare type ListItemState = ' ' | '-' | 'x'
export function parseList(
  content: string,
  index: number,
  list: string[],
  isOrder: boolean
) {
  const re = isOrder ? orderListRE : unorderListRE
  const [, indent, tag, state, contentText] = re.exec(content) || []
  
  let children: Array<any> = [] // find children by indent level bigger then current list item

  for (let i = index + 1; i < list.length; i++) {
    const node = list[i]
    if (unorderListRE.test(node) || orderListRE.test(node) || headerRE.test(node)) {
      break
    }
  }
  
  return {
    content: parseText(contentText, index),
    children,
    tag: tag.trim(),
    state: state.trim().replace(/^\[|\]$/, ''), // ' ', '-', 'x'
    isOrder,
    index,
    indent: indent.length
  };
}

export function parseBlock(
  content: string,
  index: number,
  list: string[]
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

  // FIX: #+begin_src emacs-lisp -n -r, without attributes
  if (optionEndIndex === -1) {
    optionEndIndex = attr.length;
  }

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

            return null;
          })
          .filter(Boolean)
      : [],
    options,
    index,
  } as BlockNode;

  // remove code from original list
  list.splice(index + 1, i - index);

  // pure text blocks, eg. example, textbox
  if (textBlockNames.indexOf(node.name) > -1) {
    node.type = NodeTypes.TEXT_BLOCK;
    node.code = parseText(node.code as string, index);
  }

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

export function parseHeader(
  source: string,
  index: number,
  list: string[]
): HeaderNode | null {
  const { content, tags } = parseTags(source);

  const matched = content.match(headerRE);

  if (matched == null) {
    return null;
  }

  const [, stars, title] = matched;

  const properties: Array<PairNode<string | Timestamp>> = [];
  // find deadline & properties
  for (let i = index + 1; i < list.length; i++) {
    const next = list[i];
    // next header, exit
    if (headerRE.test(next)) break;
    let matched;
    if (deadlineRE.test(next)) {
      matched = next.match(deadlineRE);
      if (matched) {
        list[i] = '';
        properties.push({
          name: 'deadline',
          value: matchTimestamp(matched[1]),
        });
      }
    } else if (/^\s*:PROPERTIES:/.test(next)) {
      const endIdx = findIndex(
        list,
        (ele: string) => {
          return /^\s*:END:/.test(ele);
        },
        i
      );

      if (endIdx === -1) {
        // error header properties syntax
        throw new SyntaxError(
          `[parseHeader|PROPERTIES] no properties end tag.`
        );
      }

      const propList = list.slice(i + 1, endIdx + i);
      // remove from original list
      list.splice(i, propList.length + 2, '');
      propList.forEach((prop) => {
        const match = prop.match(/^\s*:([\w-_]+):(.*)/i);
        match &&
          properties.push({
            name: match[1].toLowerCase(),
            value: match[2].trim(),
          });
      });
    }
  }

  return {
    type: NodeTypes.HEADER,
    content: parseText(title, index), // title contains special node
    title,
    index,
    indent: 0,
    tags,
    level: stars.length,
    properties,
  };
}

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
    children: [
      {
        // foreach to handle more special text node
        type: NodeTypes.TEXT,
        content: content.trim(),
        indent,
        index,
      },
    ],
    indent,
    index,
  };

  // 1. parse emphasis text
  parseEmphasisText(node);

  // 2. parse timestamp text
  parseTimestamp(node);

  // 3. parse external links(inc. image) in text
  parseExternalLink(node);

  // 4. parse inner links
  parseInnerLink(node);

  // 5. parse state keywords(eg. TODO, DONE, CANCELLED)
  parseStateKeywords(node);

  // 将内容解析成 children，content 置空
  return node;
}

export function parseEmphasisText(node: TextNode) {
  parseTextExtra(node, emphasisRE, (values: string[]) => {
    const [sign, matchValue] = values;
    return { type: NodeTypes.EMPHASIS, tag: sign, content: matchValue };
  });
}

export function parseTimestamp(node: TextNode) {
  parseTextExtra(node, timestampRE, (values: string[]) => {
    const timestamp: Timestamp = matchTimestamp(values[0]);
    return { timestamp, type: NodeTypes.TIMESTAMP };
  });
}

export function parseExternalLink(node: TextNode) {
  parseTextExtra(node, extLinkRE, (values: string[]) => {
    const [url, description] = values;
    const trimUrl = url.trim();
    // [[url:abbrev][description]]
    const match = /:([\w_-]+)$/.exec(trimUrl);
    let abbrev = '';
    if (match) {
      abbrev = match[1] || '';
    }
    return { type: NodeTypes.EXTERNAL_LINK, url: trimUrl, description, abbrev };
  });
}

export function parseInnerLink(node: TextNode) {
  parseTextExtra(node, innerLinkRE, (values: string[]) => {
    return { type: NodeTypes.INNER_LINK, url: values[0] };
  });
}

export function parseStateKeywords(node: TextNode) {
  parseTextExtra(node, stateRE, (values: string[]) => {
    return { type: NodeTypes.STATE, content: values[0] };
  });
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

export function matchTimestamp(timestamp: string): Timestamp {
  const re =
    /((?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})|(?<week>\w{3})|(?<time>\d{2}:\d{2}(-\d{2}:\d{2})?)|(?<dein>[-+]\d+[wydm]))/gi;

  let result: any = {};
  for (const match of timestamp.matchAll(re)) {
    const gs = match.groups;
    if (gs) {
      Object.keys(gs).forEach((key) => {
        if (gs[key]) result[key as string] = gs[key];
      });
    }
  }

  return result as Timestamp;
}

export function extractHeaderProperties(nodes: any) {
  const list: any = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === NodeTypes.HEADER) {
      // TODO
    }
  }

  return list;
}

function findIndex(
  list: Array<any>,
  callback: (element: any, index: number, list: Array<any>) => any,
  fromIndex: number = 0
) {
  return list.slice(fromIndex).findIndex(callback);
}

// parse something in text node
function parseTextExtra(
  node: TextNode,
  re: RegExp,
  parser: (val: string[]) => any
) {
  const children: any = [];

  node.children!.forEach((child: any) => {
    let cursor = 0,
      result;
    const source = child.content;
    if (child.type === NodeTypes.TEXT && source) {
      while ((result = re.exec(source))) {
        const [matchText, ...values] = result;
        const pureText = source.slice(cursor, result.index);
        // left text node
        children.push({
          type: NodeTypes.TEXT,
          content: pureText,
        });

        // current node, more value to outer fn
        const current = parser(values);

        if (current) {
          children.push({
            ...child,
            ...current,
            content: matchText,
          });
        }

        cursor = result.index + matchText.length;
      }

      if (source) {
        // right text node
        children.push({
          type: NodeTypes.TEXT,
          content: source.slice(cursor),
        });
      }
    } else {
      children.push(child);
    }
  });

  node.children = children.filter((child: any) => child!.content !== '');

  return node;
}
