/**
 * 解析成对出现的特殊字体或格式，代码参考的是 vue3 的 compiler-core/src/parse.ts 中的
 * 对 SFC template 解析的代码。
 * 如：_underline_, +line through+, /italic/, *bold*
 * 或自定义的，如：!@%& 组件成不同字体文字，或 <color:text> color:text, 等等
 * 更丰富的文本。
 * @fileOverview
 * @name emphasis.ts
 * @author Zhicheng Lee <gccll.love@gmail.com>
 * @license MIT
 */
import { isArray } from './utils';
import {
  OrgEmphasisNode,
  InlineEmphasisSign,
  OrgTextNode,
  OrgTextChildNode,
  OrgTimestampNode,
  OrgTimestamp,
  OrgLinkNode,
  OrgColorfulTextNode,
  OrgStateNode,
  OrgInterpolationNode,
  OrgNodeTypes,
  OrgStates,
} from './ast';
import * as re from './regexp';
import { matchTimestamp } from './utils';

const extraTags = ['!', '@', '%', '&'];
export const extraTagMap = extraTags.reduce((tags: string[], tag: string) => {
  for (let i = 0; i < extraTags.length; i++) {
    tags.push(tag + extraTags[i]);
  }
  return tags;
}, []);
export const tagMap: Record<string, string> = {
  _: '_', // underline
  '<': '>', // inner link, timestamp, ...
  '+': '+', // line through
  '/': '/', // italic
  '{': '}',
  '[[': ']]', // external link
};
extraTagMap.forEach((tag: string) => (tagMap[tag] = tag));

const endTokens: string[] = [
  '_',
  '>',
  '+',
  '<',
  '/',
  '{',
  '[[',
  ...extraTagMap,
];

export function last<T>(xs: T[]): T | undefined {
  return xs[xs.length - 1];
}

function isStartTag(ch: string): boolean {
  return Object.keys(tagMap).includes(ch);
}

function isEndTag(ch: string): boolean {
  return Object.values(tagMap).includes(ch);
}

export interface OrgNestContext {
  source: string;
}

// entry function
export function parseEmphasisNode(
  content: string,
  padSpaces = true
): OrgTextNode {
  content = padSpaces ? `${content}   ` : content;
  const context: OrgNestContext = { source: content };
  const root: OrgTextNode = {
    type: OrgNodeTypes.TEXT,
    children: [],
  };

  root.children = parseChildren(context, []);
  root.children = root.children.filter((child) => {
    if (typeof child.content === 'string') {
      return child.content.trim() !== '';
    }
    return true;
  });
  return root;
}

// <2022-12-22 11:00>
function parseTimeStamp(context: OrgNestContext): OrgTimestampNode {
  let s = context.source;
  const [text, ts] = re.timestampXRE.exec(s) || [];
  context.source = s.slice(text.length);
  return {
    timestamp: matchTimestamp(ts) as OrgTimestamp,
    type: OrgNodeTypes.TIMESTAMP,
  };
}

// deprecated
export function parseColorText(context: OrgNestContext): OrgColorfulTextNode {
  let s = context.source;
  const [text, color, value] = re.colorTextRE.bareBegin.exec(s) || [];
  context.source = s.slice(text.length);
  return {
    type: OrgNodeTypes.COLORFUL_TEXT,
    color,
    content: value,
    indent: 0,
    // 颜色文本比较特殊，无法从正常的 parseChildren 流程中解析出其 children
    // 因此这里手动执行一次
    children: parseChildren({ source: value }, []),
  };
}

// [[url:abbrev][description]]
function parseExtLink(context: OrgNestContext): OrgLinkNode {
  const s = context.source;
  const [text, url, description] = re.extLinkXRE.exec(s) || [];
  context.source = s.slice(text.length);
  const trimUrl = url.trim();
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
}

// <<meta-id>> 内部链接多是标题的 meta id
function parseInnerLink(context: OrgNestContext): OrgLinkNode {
  const s = context.source;
  const [text, url] = re.innerLinkXRE.exec(s) || [];
  context.source = s.slice(text.length);
  return {
    type: OrgNodeTypes.LINK,
    linkType: 'inner',
    url,
  };
}

function parseStateKeyword(context: OrgNestContext): OrgStateNode {
  const s = context.source;
  const [text, state] = re.stateXRE.exec(s) || [];
  context.source = s.slice(text.length);

  return {
    type: OrgNodeTypes.STATE,
    state: state as OrgStates,
  };
}

// deprecated
export function parsePureLink(context: OrgNestContext): OrgLinkNode {
  const s = context.source;
  const [url] = re.pureLinkRE.exec(s) || [];
  context.source = s.slice(url.length);

  return {
    type: OrgNodeTypes.LINK,
    linkType: 'external',
    url,
    description: url,
  };
}

// 解析 <badge:xx|yy...>
// TODO 扩展到其它特殊的 color 文本
export function parseColorBadge(context: OrgNestContext): OrgColorfulTextNode {
  const s = context.source;
  const [text = '', value] = /^\s*<badge:([^>]+)>/.exec(s) || [];

  context.source = s.slice(text.length);

  return {
    type: OrgNodeTypes.COLORFUL_TEXT,
    color: 'badge',
    indent: 0,
    content: value,
  };
}

function parseInterpolation(
  context: OrgNestContext
): OrgInterpolationNode | undefined {
  const s = context.source;
  // FIX: special tags prefix #60
  const [match, key] = /\s*{([#\w]+)}/.exec(s) || [];
  if (match) {
    context.source = s.slice(match.length);
    return {
      type: OrgNodeTypes.INTERPOLATION,
      key,
    };
  }

  return;
}

function parseChildren(
  context: OrgNestContext,
  ancestors: OrgTextChildNode[]
): OrgTextChildNode[] {
  const nodes: OrgTextChildNode[] = [];

  while (!isEnd(context, ancestors)) {
    advanceBy(context); // trim start spaces
    const s = context.source;
    let node: OrgTextChildNode | undefined = undefined;

    const ds = s.slice(0, 2); // 取头两个，可能是 !@%& 组合 !@,...
    if (re.stateXRE.test(s)) {
      node = parseStateKeyword(context);
    } else if (
      (isStartTag(s[0]) && s[1] !== ' ') ||
      (isStartTag(ds) && s[2] !== '')
    ) {
      // 处理一些特殊的非嵌套文本
      let jumpOut = false;
      if (s[0] === '[') {
        console.log({ s, x: re.timestampXRE.test(s) })
        if (s[1] === '[' && re.extLinkXRE.test(s)) {
          // external link
          node = parseExtLink(context);
          jumpOut = true;
        } else if (re.timestampXRE.test(s)) {
          node = parseTimeStamp(context)
          jumpOut = true
        }
      } else if (s[0] === '<') {
        jumpOut = true;
        if (s[1] === '<' && re.innerLinkXRE.test(s)) {
          node = parseInnerLink(context);
        } else if (re.timestampXRE.test(s)) {
          node = parseTimeStamp(context);
        } else {
          jumpOut = false;
        }
      } else if (s[0] === '{') {
        node = parseInterpolation(context);
        jumpOut = !!node;
      }

      if (!jumpOut) {
        node = parseElement(context, ancestors);
      }
    } else if (isEndTag(s[0]) || isEndTag(ds)) {
      context.source = context.source.slice(isEndTag(ds) ? ds.length : 1);
      continue;
    }

    if (!node) {
      node = parseNestText(context);
    }

    if (isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        pushNode<OrgTextChildNode>(nodes, node[i]);
      }
    } else {
      pushNode<OrgTextChildNode>(nodes, node);
    }
  }

  return nodes;
}

export function advanceBy(context: OrgNestContext, nn?: number): void {
  const s = context.source;
  let n = s.length - s.trimStart().length;
  if (nn && nn > 0) n = nn;
  if (n > 0) {
    context.source = s.slice(n);
  }
}

function parseElement(
  context: OrgNestContext,
  ancestors: OrgTextChildNode[]
): OrgEmphasisNode {
  const s = context.source;
  let tag = s[0];
  let extra = false;

  if (extraTags.indexOf(tag) > -1) {
    tag = s.substring(0, 2);
    extra = true;
  }
  context.source = s.trimStart().slice(tag.length);
  const element: OrgEmphasisNode = {
    type: OrgNodeTypes.EMPHASIS,
    sign: tag as InlineEmphasisSign,
    children: [],
    extra,
  };

  ancestors.push(element);
  const children = parseChildren(context, ancestors);
  ancestors.pop();

  element.children = children;

  const endTag = tagMap[element.sign];
  if (startsWith(context.source, endTag)) {
    context.source = context.source.slice(endTag.length);
  }

  return element;
}

function parseNestText(context: OrgNestContext): OrgTextNode {
  const s = context.source;
  let endIndex = s.length;

  for (let i = 0; i < endTokens.length; i++) {
    const token = endTokens[i];
    const index = s.indexOf(token);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  // 去掉尾部的空格
  // while (endIndex > 0 && s[endIndex] !== ' ') {
  //   endIndex--;
  // }

  const content = s.slice(0, endIndex);
  context.source = s.slice(endIndex);

  return {
    type: OrgNodeTypes.TEXT,
    content,
  };
}

function pushNode<T>(nodes: T[], node: T): void {
  nodes.push(node);
}

function isEnd(
  context: OrgNestContext,
  ancestors: OrgTextChildNode[]
): boolean {
  const s = context.source;
  const tags = Object.entries(tagMap);
  for (let i = 0; i < tags.length; i++) {
    const [start, end = start] = tags[i];
    if (checkIsEnd(s, ancestors, start, end)) {
      return true;
    }
  }

  return !s;
}

function checkIsEnd(
  s: string,
  ancestors: OrgTextChildNode[],
  startTag: string,
  endTag = startTag
): boolean {
  if (startsWith(s, endTag)) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      const c = ancestors[i];
      if ('sign' in c && c.sign === startTag) {
        return true;
      }
    }
  }
  return false;
}

function startsWith(s1: string, s2: string): boolean {
  return s1.startsWith(s2);
}
