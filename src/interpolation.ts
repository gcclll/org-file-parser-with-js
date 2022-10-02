import {
  OrgColorfulTextNode,
  OrgTextNode,
  OrgTimestampNode,
  OrgTimestamp,
  OrgNodeTypes,
} from './ast';
import { tagMap } from './emphasis';
import { buildBadgeJSON } from './transform';
import { str2Code, matchTimestamp } from './utils';

export type OrgInterpoValue =
  | OrgColorfulTextNode
  | OrgTextNode
  | OrgTimestampNode;
// 插值功能，将一些特殊的文本事先拆分出来，使用插值替换，在后面的 transform 阶段使用
// 这个进行替换
export const interpolations: Record<string, OrgInterpoValue> = {};

export function getInterpo(key: string): OrgInterpoValue {
  return interpolations[key];
}

function replaceToken(token: string, source: string): string {
  const len = token.length;

  // 需要转义的字符: +, [
  const re = new RegExp(`\\s+(${token.replace(/(\+|\[)/g, '\\$1')})\\s+`, 'g');

  source = source.replace(re, (_, p1) => {
    let name = `#${str2Code(p1)}`;
    // 处理多字符的符号，如：!!x!!
    if (len > 1) {
      let n = 1;
      while (n++ < len) {
        name += str2Code(p1[n]);
      }
    }
    // interpolations['#60'] = '<'

    if (!interpolations[name]) {
      interpolations[name] = {
        type: OrgNodeTypes.TEXT,
        content: p1,
      };
    }

    return ` {${name}} `;
  });

  return source;
}

// 将一些特殊字符单独处理成字节码值，这里直接转换下方便后面的处理流程，
// 如：`<` -> 60 -> #60 做为 key
// 如果是多字符，key 规则如：`[[` -> 91 -> #9191
export function handleSpecialTags(list: string[]) {
  const startTokens = Object.keys(tagMap);
  const endTokens = Object.values(tagMap);
  for (let i = 0; i < list.length; i++) {
    let s = list[i];
    if (!s) continue;

    // start tokens
    for (let j = 0; j < startTokens.length; j++) {
      const c = startTokens[j];
      if (c) s = replaceToken(c, s);
      list[i] = s;
    }

    // end tokens
    for (let k = 0; k < startTokens.length; k++) {
      const c = endTokens[k];
      if (c) s = replaceToken(c, s);
      list[i] = s;
    }
  }
}

// 处理 <badge:message|message-color> 文本
export function handleBadgeInterpo(list: string[]) {
  const badgeRE = /<badge:\s*([^>]+)>/g;
  for (let i = 0; i < list.length; i++) {
    let s = list[i];
    if (!s) continue;

    s = s.replace(badgeRE, (match, p1, offset) => {
      const name = `badge${offset}`;
      interpolations[name] = {
        type: OrgNodeTypes.COLORFUL_TEXT,
        color: 'badge',
        content: match,
        badge: buildBadgeJSON(p1),
      };
      return `{${name}}`;
    });

    list[i] = s;
  }
}

export function handleInactiveDate(list: string[]) {
  const re = /\[(\d{4}-\d{2}-\d{2}(?:[\w\s\-+:]+)?)\]/g;
  for (let i = 0; i < list.length; i++) {
    let s = list[i];
    if (!s) continue;

    s = s.replace(re, (_, p1, offset) => {
      const name = `inactiveTimestamp${offset}`;
      interpolations[name] = {
        type: OrgNodeTypes.TIMESTAMP,
        timestamp: matchTimestamp(p1) as OrgTimestamp,
      };

      return `{${name}}`;
    });

    list[i] = s
  }
}

export const handlers = [
  handleSpecialTags,
  handleBadgeInterpo,
  handleInactiveDate,
];
