import { OrgEmphasisNode, OrgNodeTypes } from './ast';
import { isString, assign } from './utils';
import { colorTextRE } from './regexp';
import { parseEmphasisNode } from './emphasis';

export function transformColorText(node: OrgEmphasisNode): void {
  if (node.type === OrgNodeTypes.EMPHASIS && node.sign === '<') {
    const [first] = node.children || [];
    if (first && first.type === OrgNodeTypes.TEXT) {
      const s = first.content as string;
      if (isString(s) && colorTextRE.bareBegin.test(s + ' ')) {
        const idx = s.indexOf(':');
        if (idx > 0) {
          const color = s.substring(0, idx);
          const value = s.substring(idx + 1);
          assign(node as any, {
            type: OrgNodeTypes.COLORFUL_TEXT,
            color,
          });

          first.content = value; // red:underline -> underline
          // 将值部分再解析
          first.children = parseEmphasisNode(value).children;
        }
      }
    }
  }
}

export const transforms = [
  transformColorText
]
