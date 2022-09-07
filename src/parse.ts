import {
  OrgParserOptions,
  OrgAttribute,
  OrgBlockNode,
  OrgBlockOptions,
  OrgListItem,
  OrgListItemState,
  OrgHeaderNode,
  OrgHeaderProperty,
  OrgClockValue,
  OrgPropertyNode,
  OrgSubSupNode,
  OrgTextNode,
  OrgTableNode,
  OrgTableRowType,
  OrgValidNode,
  OrgTextChildNode,
  OrgRootNode,
  OrgNodeTypes,
  SIGN_SUB,
} from './ast';
import * as re from './regexp';
import { parseEmphasisNode } from './emphasis';
import { matchTimestamp, findIndex, traverse, isString } from './utils';
import { transformColorText, normalTransforms } from './transform';

export function baseParse(
  source: string,
  options?: OrgParserOptions
): OrgRootNode {
  const { extraTextBackground } = options || {};

  // 按行分析，因为 file.org 文档中主要是按照行来区分文章内容的。
  const list = source.split(/\n+/);

  let nodes: OrgValidNode[] = [];

  // 文章开头可能包含一些全文的属性，比如：org-roam 的 ID
  const properties: Array<OrgAttribute> = parseHeadProperty(0, list);

  for (let i = 0; i < list.length; i++) {
    const node = parseNode(list[i], list, i);
    if (node) {
      nodes.push(node);
    }
  }

  nodes = nodes.filter((node: OrgValidNode) => node && node.content !== '');

  const root: OrgRootNode = {
    type: OrgNodeTypes.ROOT,
    children: nodes,
    properties,
    footnotes: [],
    options,
  };

  traverse(
    root,
    (node: OrgValidNode, parent: OrgValidNode, childIndex: number) => {
      if (node.type === OrgNodeTypes.EMPHASIS) {
        // 处理 content 中包含 red:text 的文本，因为 emphasis.ts 中会将
        // _u1 <red:underline ... /italic/ xxx> u2_ 这种复杂的文本中的 <red:underline 解析
        // 成 EMPHASIS 节点。
        transformColorText(node);

        // 控制 extra emphasis text(!@%&) 文本的背景显示
        if (node.extra && extraTextBackground) {
          node.background = extraTextBackground;
        }
      } else if (node.type === OrgNodeTypes.BLOCK) {
        if (node.name === 'textbox' && isString(node.code)) {
          node.code = parseEmphasisNode(node.code as string);
        }
      }

      // normal transforms
      normalTransforms.forEach((t) => t(node, parent, childIndex));
    }
  );

  return root;
}

function parseNode(
  source: string,
  list: string[],
  index: number
): OrgValidNode | undefined {
  let node: OrgValidNode | undefined;

  if (re.tableRowRE.test(source)) {
    node = parseTable(source, list, index);
  } else if (re.blockBeginRE.test(source)) {
    node = parseBlock(source, list, index);
  } else if (re.propertyRE.test(source)) {
    node = parseProperty(source, list, index);
  } else if (re.headerRE.test(source)) {
    node = parseHeader(source, list, index);
  } else if (re.unorderListRE.test(source)) {
    node = parseList(source, list, index, false);
  } else if (re.orderListRE.test(source)) {
    node = parseList(source, list, index, true);
  } else {
    node = undefined;
  }

  if (!node) {
    node = parseText(source, list, index);
  }

  return node;
}

function parseTable(
  source: string,
  list: string[],
  index: number
): OrgTableNode {
  let nodes: Array<OrgTableRowType> = [];
  let firstRow: Array<string> | undefined;
  let indent = source.length - source.trimStart().length;

  let start = index,
    end = index + 1;
  for (let i = index; i < list.length; i++) {
    let s = list[i].trim();
    if (s == '') {
      continue;
    }

    // 使用 tableRowRE 变量的话会存在正则记录 lastIndex 问题
    if (re.tableRowLineRE.test(s)) {
      // nodes.push(true);
    } else if (re.tableRowRE.test(s)) {
      const ss = s.replace(/^\||\|$/g, '');
      const values = ss.split('|').map((s) => s.trim());
      if (!firstRow) {
        firstRow = values;
        continue;
      }

      // ['a', 'b', 'c'] => { '0': 'a', '1': 'b', '2': 'c' }
      // 与 columns 对应关系：[{ label: 'xxx', prop: '0' }, ...]
      nodes.push(
        values.reduce((o, val, index) => {
          o[index + ''] = val;
          return o;
        }, {} as { [prop: string]: string })
      );
    } else {
      end = i;
      break;
    }
  }

  const rows = end - start;
  list.splice(start, rows);

  return {
    type: OrgNodeTypes.TABLE,
    nodes,
    columns: firstRow
      ? firstRow.map((val: string, i: number) => ({
          label: val,
          prop: i + '',
        }))
      : [],
    rows,
    indent,
  };
}

function parseList(
  source: string,
  list: string[],
  index: number,
  isOrder: boolean
): OrgListItem {
  const _re = isOrder ? re.orderListRE : re.unorderListRE;
  const [, indent = '', name = '', state = '', text = ''] =
    _re.exec(source) || [];

  return {
    type: OrgNodeTypes.LIST_ITEM,
    content: parseText(text, list, index),
    children: [],
    name,
    state: state as OrgListItemState,
    indent: indent.length,
    isOrder,
  };
}

export function parseTextWithNode(
  node: OrgTextNode,
  keyOrAll?: string | boolean
): OrgTextChildNode | undefined {
  let key = 'content',
    all = false;
  if (typeof keyOrAll === 'string') {
    key = keyOrAll;
  } else if (typeof keyOrAll === 'boolean') {
    all = keyOrAll;
  }
  const s = node[key as keyof OrgTextNode];

  const reParserMap: Array<[RegExp, (node: OrgTextNode) => OrgTextChildNode]> =
    [
      // parse state keywords(eg. TODO, DONE, CANCELLED)
      [re.stateRE, parseStateKeywords],
      // parse sub or sup text, 如：header_sub 或 header_{sub}
      [re.subSupRE, parseSubSupText],
      // parse colorful bare text, 如：red:red-text
      [re.colorTextRE.bareGlobal, parseColorfulBareText],
      [re.colorTextRE.bareBeginGlobal, parseColorfulBareText],
    ];

  // 需要递归进行解析，因此需要保证每个函数都能被执行到
  if (all) {
    reParserMap.forEach(([, parser]) => parser(node));
    return;
  }

  // 这里适合用于单个匹配情况下执行，满足一个正则就立即解析出结果
  // 如：标题上有上下标时(sub/sup)，而上下标又支持富文本情况(如：颜色，斜体等等)
  // 但不能多重嵌套(TODO)
  for (let i = 0; i < reParserMap.length; i++) {
    const [re, parser] = reParserMap[i];

    if (typeof s === 'string' && re.test(s)) {
      return parser(node);
    }
  }

  return;
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
  }; // parseEmphasisNode(source.trim());
  // node.indent = indent

  parseTextWithNode(node, true);

  const children = [];

  if (node.children?.length) {
    for (let i = 0; i < node.children!.length; i++) {
      const child = node.children[i];
      if (!child) continue;

      if (
        child.type === OrgNodeTypes.COLORFUL_TEXT ||
        child.type === OrgNodeTypes.STATE ||
        child.type === OrgNodeTypes.SUB_SUP
      ) {
        // 简单文本已经处理过了，不需要再处理
        children.push(child);
        continue;
      }

      // 复杂，成对(_underline_, ...)，可能嵌套的富文本，解析出来合并
      const complexNode: OrgTextNode = parseEmphasisNode(
        child.content as string
      );
      children.push(...(complexNode.children || []));
    }
  }

  node.children = children;

  return node;
}

// red:xxxx
export function parseColorfulBareText(node: OrgTextNode) {
  return parseTextExtra(node, re.colorTextRE.bareGlobal, (values: string[]) => {
    const [, color, text] = values;
    return {
      type: OrgNodeTypes.COLORFUL_TEXT,
      color: color.trim(),
      content: text as any, //parseText(text, 0),
      indent: 0,
    };
  });
}

export function parseSubSupText(node: OrgTextNode) {
  return parseTextExtra(node, re.subSupRE, (values: string[]) => {
    const [, target, sign, value] = values;
    const o = {
      target,
      sign,
      type: OrgNodeTypes.SUB_SUP,
      value,
    } as OrgSubSupNode;
    if (sign === SIGN_SUB) {
      o.sub = true;
    } else {
      o.sup = true;
    }
    return o;
  });
}

export function parseStateKeywords(node: OrgTextNode) {
  return parseTextExtra(node, re.stateRE, (values: string[]) => {
    return { type: OrgNodeTypes.STATE, state: values[1] as any };
  });
}

function parseBlock(
  source: string,
  list: string[],
  index: number
): OrgBlockNode | undefined {
  const matched = re.blockBeginRE.exec(source);

  if (!matched) {
    return;
  }

  let i;
  // 找到最近的 end block
  // TODO 解决嵌套问题
  for (i = index + 1; i < list.length; i++) {
    const next = list[i];
    if (next?.match(re.blockEndRE)) {
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
    indent: (matched[1] || '').length,
    name: (matched[2] || '').trim(),
    code: list.slice(index + 1, i).join('\n'),
    lang: (matched[3] || '').trim(),
    attributes,
    options,
  };

  // 将代码块从源 list 中删除，避免重复解析
  list.splice(index + 1, i - index);

  // 找到对应的结果(如果是代码块，可直接执行得到 #+RESULT：结果)
  // parseBlockResult(node, list, index + 1)

  return node;
}

function parseCLIOption(s: string): OrgBlockOptions {
  s = ` ${s} `;

  let result;
  let nodes: OrgBlockOptions = [];
  while ((result = re.blockOptionsRE.exec(s))) {
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
  const matched = source.match(re.propertyRE);
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
  const matched = content.match(re.headerRE);

  if (!matched) return;

  let [, stars, title] = matched;
  const properties: Array<OrgHeaderProperty> = parseHeadProperty(
    index + 1,
    list
  );

  const titled: OrgTextChildNode = parseText(title, list, index);

  const { children = [] } = titled;
  if (children.length) {
    // 进一步解析 child.type 是 OrgNodeTypes.SUB_SUP 类型的节点
    // 因为它可能是富文本形式(colorful/emphasis)
    titled.children = children.map((child) => {
      if (
        child.type === OrgNodeTypes.SUB_SUP &&
        typeof child.value === 'string'
      ) {
        child.value = parseText(child.value, [], 0);
      }
      return child;
    });
  }

  return {
    type: OrgNodeTypes.HEADER,
    title: titled,
    indent: 0,
    level: stars.length,
    properties,
    tags,
  };
}

// PROPERTIES, LOGBOOK
function parseHeadProperty<T = OrgHeaderProperty>(
  startIndex: number,
  list: string[]
): Array<T> {
  const properties: Array<T> = [];

  const singlePropertyRE = /\s*([A-Z]+):(.*)/; // CLOSED, DEADLINE
  const multiPropertyRE = /\s*:([A-Z]+):/; // LOGBOOK, PROPERTIES
  for (let i = startIndex; i < list.length; i++) {
    const next = list[i];
    // FIX: 非标题的property 不应该解析到header 中
    // 只有 `:NAME: value` 或 `#+name: value` 开头的是合法的标题属性
    if (
      next.trim() &&
      (re.headerRE.test(next) ||
        !(singlePropertyRE.test(next) || multiPropertyRE.test(next)))
    )
      break;

    let matched;
    if (multiPropertyRE.test(next)) {
      matched = next.match(multiPropertyRE);
      const endIdx = findIndex(
        list,
        (ele: string) => {
          return /^\s*:END:/.test(ele);
        },
        i
      );
      if (endIdx === -1) {
        // TODO error no end
      }
      const propList = list.slice(i + 1, endIdx + i);
      // remove from original list
      list.splice(i, propList.length + 2, '');
      const [, category = ''] = matched || [];
      propList.forEach((prop: string) => {
        let [, name = '', value = ''] =
          prop.match(/^\s*:?([A-Z-_]+):(.*)/) || [];
        value = value.trim();
        if (name === 'CLOCK') {
          value = parseClockValue(value) as string;
        }
        properties.push({
          name,
          value,
          category,
        } as any);
      });
    } else if (singlePropertyRE.test(next)) {
      matched = next.match(singlePropertyRE);
      if (matched) {
        list[i] = '';
        const [, name = '', value = ''] = matched;
        properties.push({
          name,
          value: matchTimestamp(value.trim()),
        } as any);
      }
    }
  }

  return properties;
}

function parseTags(content: string): {
  content: string;
  tags: string[];
} {
  // 标题上下标需要支持更多样式，如：颜色，因此需要过滤掉 ^{}, 或 _{} 情况
  const tagRE = /:[^{}]+:/gi;
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

// parse something in text node
function parseTextExtra(
  node: OrgTextNode,
  re: RegExp,
  parser: (val: string[]) => OrgTextChildNode
): OrgTextChildNode {
  const children: OrgTextChildNode[] = [];

  const count = node.children!.length;
  if (count === 0) {
    if (typeof node.content === 'string') {
      node.children = [
        {
          type: OrgNodeTypes.TEXT,
          content: node.content,
          children: [],
        },
      ];
    } else if (typeof node.content === 'object') {
      node.children = [{ ...node.content }];
    }
  }

  node.children!.forEach((child: OrgValidNode) => {
    let cursor = 0,
      result;
    // FIX: `red:text` 因为前后没有空格不能被正确解析
    const source = ` ${child.content} `;

    if (child.type === OrgNodeTypes.TEXT && typeof source === 'string') {
      while ((result = re.exec(source))) {
        const [matchText] = result;
        const pureText = source.slice(cursor, result.index);
        // left text node
        children.push({
          type: OrgNodeTypes.TEXT,
          content: pureText.trim(),
          indent: 0,
          children: [],
        });

        // current node, more value to outer fn
        const current = parser(result);

        if (current) {
          children.push({
            ...child,
            content: matchText.trim(),
            ...current,
          });
        }

        cursor = result.index + matchText.length;
      }

      if (source) {
        // right text node
        children.push({
          type: OrgNodeTypes.TEXT,
          content: source.slice(cursor).trim(),
          indent: 0,
          children: [],
        });
      }
    } else {
      children.push(child as any);
    }
  });

  node.children = children.filter((child: any) => child!.content !== '');

  return node;
}

//[2022-08-05 Fri 17:38]--[2022-08-05 Fri 17:39] =>  0:01
// => { start: OrgTimeStamp, end: OrgTimestamp, duration: '0:01' }
function parseClockValue(value: string): OrgClockValue | string {
  const re =
    /\[(\d{4}-\d{2}-\d{2}\s+[\w\s\d:]+)]\s*--\s*\[(\d{4}-\d{2}-\d{2}\s+[\w\s\d:]+)]\s+=>\s+(.*)/;

  const [, start = '', end = '', duration = ''] = value.match(re) || [];

  if (start) {
    return {
      start: matchTimestamp(start),
      end: matchTimestamp(end),
      duration,
    };
  }

  return value;
}
