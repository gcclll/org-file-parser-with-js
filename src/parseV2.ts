export const isArray = Array.isArray;

export interface OrgParserOptions {
  onError: (error: Error) => void;
}

export const enum OrgStates {
  DONE = 'DONE',
  DOING = 'DOING',
  WAITING = 'WAITING',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
}

export const enum OrgNodeTypes {
  ROOT, // 根节点
  TEXT, // pure text
  PROPERTY, // #+...
  HEADER, // ** ...
  BLOCK, // #+begin...#+end
  EMPHASIS, // =,_,/,+,$,[!&%@]{2}
  LIST, // - [-], 1. ...
  TIMESTAMP, // <2022-11-12 Wed 12:00>

  LINK, // external: [[url][name]], inner: <<meta_id>>
  STATE, // TODO, DONE, etc.

  SUB_SUP, // 下标或上标
  COLORFUL_TEXT, // 带颜色的文本
}

export interface OrgRootNode {
  type: OrgNodeTypes.ROOT;
  children: OrgValidNode[];
  properties?: OrgAttribute[]; // 页面属性，如：$+title: title value
  footnotes?: OrgFootNode[];
}

export type OrgTextChildNode =
  | OrgTextNode
  | OrgLinkNode
  | OrgEmphasisNode
  | OrgTimestampNode
  | OrgLinkNode
  | OrgStateNode
  | OrgSubSupNode
  | OrgColorfulTextNode;

export type OrgValidNode =
  | OrgPropertyNode
  | OrgHeaderNode
  | OrgBlockNode
  | OrgListNode
  | OrgTextChildNode;

export interface OrgBaseNode {
  indent?: number;
  content?: string | OrgTextChildNode;
}

export interface OrgStateNode extends OrgBaseNode {
  type: OrgNodeTypes.STATE;
  state: OrgStates;
}

export interface OrgPairNode<T> {
  name: string;
  value: T;
}

export interface OrgFootNode extends OrgPairNode<string> {}

export interface OrgTextNode extends OrgBaseNode {
  type: OrgNodeTypes.TEXT;
  content: string | OrgTextChildNode;
  children: OrgTextChildNode[];
}

export interface OrgColorfulTextNode extends OrgBaseNode {
  type: OrgNodeTypes.COLORFUL_TEXT;
  color: string;
  content: OrgTextChildNode;
}

export interface OrgTimestamp {
  year: string;
  month: string;
  day: string;
  week?: string;
  time?: string;
  dein?: string; // [+-]\d[wdmy] -> week/day/month/year
}

export interface OrgTimestampNode extends OrgBaseNode {
  type: OrgNodeTypes.TIMESTAMP;
  timestamp: OrgTimestamp;
}

export interface OrgSubSupNode extends OrgBaseNode {
  type: OrgNodeTypes.SUB_SUP;
  sign: '_' | '^';
  target: string;
  sub?: boolean;
  sup?: boolean;
}

export interface OrgPropertyNode extends OrgPairNode<string | boolean> {
  type: OrgNodeTypes.PROPERTY;
}

export interface OrgHeaderNode extends OrgBaseNode {
  type: OrgNodeTypes.HEADER;
  title: string | OrgTextChildNode;
  level: number;
  tags?: string[];
  properties?: OrgPairNode<string | OrgTimestamp>[];
}

export interface OrgAttribute extends OrgPairNode<string | boolean> {}

export interface OrgLinkNode extends OrgBaseNode {
  type: OrgNodeTypes.LINK;
  linkType: 'external' | 'inner'; // external: [[url][desc]], inner: <<meta_id>>
  url: string;
  description?: string;
  abbrev?: string; // [[url:abbrev][description]]
}

export type OrgBlockOptions = OrgAttribute[];
export interface OrgBlockNode extends OrgBaseNode {
  type: OrgNodeTypes.BLOCK;
  name: string;
  code: string | OrgTextNode;
  lang?: string;
  attributes?: OrgAttribute[];
  options?: OrgBlockOptions;
}

export declare type OrgListItemState = ' ' | '-' | 'x' | 'X';
export interface OrgListNode extends OrgBaseNode {
  type: OrgNodeTypes.LIST;
  name: string; // 无序：-/+, 有序：1)/a)/1./a.
  content: OrgTextNode;
  isOrder: boolean; // 有序列表/无序列表
  state: OrgListItemState;
  children: OrgValidNode[];
}

export const enum InlineEmphasisSign {
  CODE_EQUAL = '=',
  CODE_WAVE = '~',
  LINE_THROUGH = '+',
  UNDERLINE = '_',
  ITALIC = '/',
  BOLD = '*',
  LATEX = '$',
}

export interface OrgEmphasisNode extends OrgBaseNode {
  type: OrgNodeTypes.EMPHASIS;
  sign: InlineEmphasisSign;
}

export const SIGN_SUB = '_';
export const SIGN_SUP = '^';

// 正则表达式
export const propertyRE = /^(\s*)#\+(?!begin|end)([\w-_]+)\s*:(.*)$/i;
export const headerRE = /^(\*+)\s+(.*)$/i;
export const blockRE =
  /^(\s*)#\+begin_([\w-]+)\s+([\w-]+)\s+(:[^\n]+\n)\s*(.*)#\+end_(\2)/i;
export const blockBeginRE = /^(\s*)#\+begin_([\w-]+)(\s+[\w-]+)?(\s+.*)?/;
export const blockEndRE = /^(\s*)#\+end_([\w-]+)$/;
export const blockOptionsRE = /-(\w)\s([^-]+)?/gi;
export const unorderListRE = /^(\s*)(-|\+|\s+\*)\s+(\[[-x ]\]\s+)?(.*)$/;
export const orderListRE = /^(\s*)([\d\w]+)(?:\.|\))\s+(\[[-x ]\]\s+)?(.*)$/;
export const extLinkRE = /\[\[([^[\]]+)](\[([^[\]]+)])?\]/g;
export const innerLinkRE = /<<([^<>]+)>>/g;
export const emphasisRE =
  /([=~\+_/\$\*]|[!&%@][!&%@])(?=[^\s])([^\1]+?\S)(?:\1)/g;
export const timestampRE = /\<(\d{4}-\d{2}-\d{2}\s+[^>]+)>/gi; // check timestamp re
export const deadlineRE = /^\s*DEADLINE:(.*)/i;
export const subSupRE = /(\w+)(\^|_){?([\w_-]+)}?/gi;

const colorNameREStr = `\\w+|#[0-9a-e]{3}|#[0-9a-e]{6}`;
export const colorfulTextRE = new RegExp(
  `<(${colorNameREStr}):([^<>]+)>`,
  'gi'
);
export const colorfulBareTextRE = new RegExp(
  `\\s+(${colorNameREStr}):([^\\s]+)\\s+`,
  'gi'
);

const states = ['TODO', 'DONE', 'CANCELLED'];
export const stateRE = new RegExp(`(${Object.keys(states)})`, 'g');

export function baseParse(
  source: string,
  options: OrgParserOptions = {
    onError: (error: Error) => console.warn(error),
  }
): OrgRootNode {
  // 按行分析，因为 file.org 文档中主要是按照行来区分文章内容的。
  const list = source.split(/\n+/);
  console.log(options);

  let nodes: OrgValidNode[] = [];

  for (let i = 0; i < list.length; i++) {
    const node = parseNode(list[i], list, i);
    if (node) {
      nodes.push(node);
    }
  }

  return {
    type: OrgNodeTypes.ROOT,
    children: [],
    properties: [],
    footnotes: [],
  };
}

function parseNode(
  source: string,
  list: string[],
  index: number
): OrgValidNode | undefined {
  let node: OrgValidNode | undefined;

  if (blockBeginRE.test(source)) {
    node = parseBlock(source, list, index);
  } else if (propertyRE.test(source)) {
    node = parseProperty(source, list, index);
  } else if (headerRE.test(source)) {
    node = parseHeader(source, list, index);
  } else if (unorderListRE.test(source)) {
    node = parseList(source, list, index, false);
  } else if (orderListRE.test(source)) {
    node = parseList(source, list, index, true);
  } else {
    node = undefined;
  }

  if (!node) {
    node = parseText(source, list, index);
  }

  return node;
}

function parseList(
  source: string,
  list: string[],
  index: number,
  isOrder: boolean
): OrgListNode {
  const re = isOrder ? orderListRE : unorderListRE;
  const [, indent = '', name = '', state = '', text = ''] =
    re.exec(source) || [];

  return {
    type: OrgNodeTypes.LIST,
    content: parseText(text, list, index),
    children: [],
    name,
    state: state as OrgListItemState,
    indent: indent.length,
    isOrder,
  };
}

function parseText(source: string, _: string[], __: number): OrgTextNode {
  const matched = source.match(/^(\s+)/);
  let indent = 0;
  if (matched) {
    indent = matched[1].length;
  }

  const node: OrgTextNode = {
    type: OrgNodeTypes.TEXT,
    content: source.trim(),
    indent,
    children: [],
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

  // 6. parse sub or sup text
  parseSubSupText(node);

  // 7. parse colorful text
  parseColorfulText(node);

  // 8. parse colorful bare text
  parseColorfulBareText(node);

  // 将内容解析成 children，content 置空
  return node;
}

// red:xxxx
export function parseColorfulBareText(node: OrgTextNode) {
  return parseTextExtra(node, colorfulBareTextRE, (values: string[]) => {
    const [color, text] = values;
    return {
      type: OrgNodeTypes.COLORFUL_TEXT,
      color,
      content: text as any, //parseText(text, 0),
      indent: 0,
    };
  });
}

// <red:xxx yyy>
export function parseColorfulText(node: OrgTextNode) {
  return parseTextExtra(node, colorfulTextRE, (values: string[]) => {
    const [color, text] = values;
    return {
      type: OrgNodeTypes.COLORFUL_TEXT,
      color,
      content: text as any, //parseText(text, 0),
      indent: 0,
    };
  });
}

export function parseSubSupText(node: OrgTextNode) {
  return parseTextExtra(node, subSupRE, (values: string[]) => {
    const [target, sign] = values;
    const o = { target, sign, type: OrgNodeTypes.SUB_SUP } as OrgSubSupNode;
    if (sign === SIGN_SUB) {
      o.sub = true;
    } else {
      o.sup = true;
    }
    return o;
  });
}

export function parseStateKeywords(node: OrgTextNode) {
  return parseTextExtra(node, stateRE, (values: string[]) => {
    return { type: OrgNodeTypes.STATE, state: values[0] as any };
  });
}

export function parseInnerLink(node: OrgTextNode) {
  return parseTextExtra(node, innerLinkRE, (values: string[]) => {
    return { type: OrgNodeTypes.LINK, linkType: 'inner', url: values[0] };
  });
}

export function parseExternalLink(node: OrgTextNode) {
  return parseTextExtra(node, extLinkRE, (values: string[]) => {
    const [url, description] = values;
    const trimUrl = url.trim();
    // [[url:abbrev][description]]
    const match = /:([\w_-]+)$/.exec(trimUrl);
    let abbrev = '';
    if (match) {
      abbrev = match[1] || '';
    }
    return {
      type: OrgNodeTypes.LINK,
      linkType: 'external',
      url: trimUrl,
      description,
      abbrev,
    };
  });
}

export function parseTimestamp(node: OrgTextNode) {
  return parseTextExtra(node, timestampRE, (values: string[]) => {
    const timestamp: OrgTimestamp = matchTimestamp(values[0]);
    return { timestamp, type: OrgNodeTypes.TIMESTAMP };
  });
}

export function parseEmphasisText(node: OrgTextNode) {
  return parseTextExtra(node, emphasisRE, (values: string[]) => {
    const [sign, matchValue] = values;
    return {
      type: OrgNodeTypes.EMPHASIS,
      sign: sign as InlineEmphasisSign,
      content: matchValue,
    };
  });
}

function parseBlock(
  source: string,
  list: string[],
  index: number
): OrgBlockNode | undefined {
  const matched = blockBeginRE.exec(source);

  if (!matched) {
    return;
  }

  let i;
  // 找到最近的 end block
  // TODO 解决嵌套问题
  for (i = index + 1; i < list.length; i++) {
    const next = list[i];
    if (next?.match(blockEndRE)) {
      break;
    }
  }

  // no end block
  if (i === list.length) {
    // TODO error
    return;
  }

  let attr = matched[4] || '';
  // 找到选项中第一个 `:` 的索引
  let optionEndIndex = attr.indexOf(':');
  let options: OrgBlockOptions = [];
  let optionString = '';

  // FIX: 解决 $+begin_src emacs-lisp -n -r 没有选项 :name value 的情况
  if (optionEndIndex === -1) {
    optionEndIndex = attr.length;
  }

  if (optionEndIndex > 0) {
    optionString = attr.slice(0, optionEndIndex);
    attr = attr.slice(optionEndIndex);
    options = parseCLIOption(optionString);
  }

  const attributes: OrgAttribute[] = [];

  if (attr) {
    const attrs: string[] = ` ${attr} `.split(/\s+:/);
    for (let i = 0; i < attrs.length; i++) {
      const attrVal = attrs[i];
      if (attrVal) {
        const [name, value = ''] = attrVal.split(/\s+/);
        if (name) {
          attributes.push({
            name: name.trim(),
            value: value === '' ? true : value.trim(),
          });
        }
      }
    }
  }

  const node: OrgBlockNode = {
    type: OrgNodeTypes.BLOCK,
    indent: matched[1].length,
    name: matched[2].trim(),
    code: list.slice(index + 1, i).join('\n'),
    lang: matched[3].trim(),
    attributes,
    options,
  };

  // 将代码块从源 list 中删除，避免重复解析
  list.splice(index + 1, i - index);

  return node;
}

function parseCLIOption(s: string): OrgBlockOptions {
  s = ` ${s} `;

  let result;
  let nodes: OrgBlockOptions = [];
  while ((result = blockOptionsRE.exec(s))) {
    const [, name, value = ''] = result;
    if (name) {
      nodes.push({
        name: name.trim(),
        value: value === '' ? true : value.trim(),
      });
    }
  }

  return nodes;
}

function parseProperty(
  source: string,
  _: string[],
  __: number
): OrgPropertyNode | undefined {
  const matched = source.match(propertyRE);
  if (matched) {
    const [, , name, value = ''] = matched;
    return {
      type: OrgNodeTypes.PROPERTY,
      name,
      value: value === '' ? true : value.trim(),
    };
  }

  return;
}

function parseHeader(
  source: string,
  list: string[],
  index: number
): OrgHeaderNode | undefined {
  const { content, tags } = parseTags(source);
  const matched = content.match(headerRE);

  if (!matched) return;

  const [, stars, title] = matched;

  const properties: OrgPairNode<string | OrgTimestamp>[] = [];
  // 找到截止时间和 properties, :PROPERTIES: ... :END:
  for (let i = index + 1; i < list.length; i++) {
    const next = list[i];
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
        // TODO error no properties end tag
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
    type: OrgNodeTypes.HEADER,
    title: parseText(title, list, index),
    indent: 0,
    level: stars.length,
    properties,
    tags,
  };
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

export function matchTimestamp(timestamp: string): OrgTimestamp {
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

  return result as OrgTimestamp;
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
  node: OrgTextNode,
  re: RegExp,
  parser: (val: string[]) => OrgTextChildNode
): OrgTextChildNode {
  const children: OrgTextChildNode[] = [];

  node.children!.forEach((child: OrgTextChildNode) => {
    let cursor = 0,
      result;
    const source = child.content;

    if (child.type === OrgNodeTypes.TEXT && typeof source === 'string') {
      while ((result = re.exec(source))) {
        const [matchText, ...values] = result;
        const pureText = source.slice(cursor, result.index);
        // left text node
        children.push({
          type: OrgNodeTypes.TEXT,
          content: pureText,
          indent: 0,
          children: [],
        });

        // current node, more value to outer fn
        const current = parser(values);

        if (current) {
          children.push({
            ...child,
            content: matchText,
            ...current,
          });
        }

        cursor = result.index + matchText.length;
      }

      if (source) {
        // right text node
        children.push({
          type: OrgNodeTypes.TEXT,
          content: source.slice(cursor),
          indent: 0,
          children: [],
        });
      }
    } else {
      children.push(child);
    }
  });

  node.children = children.filter((child: any) => child!.content !== '');

  return node;
}