import { OrgColorfulTextNode, OrgNodeTypes } from './ast';
import { buildBadgeJSON } from './transform';

export type OrgInterpoValue = OrgColorfulTextNode;
// 插值功能，将一些特殊的文本事先拆分出来，使用插值替换，在后面的 transform 阶段使用
// 这个进行替换
export const interpolations: Record<string, OrgInterpoValue> = {};

export function getInterpo(key: string): OrgInterpoValue {
  return interpolations[key];
}

// 处理
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

export const handlers = [
  handleBadgeInterpo
]
