import {
  OrgEmphasisNode,
  OrgListNode,
  OrgValidNode,
  OrgListItem,
  OrgNodeTypes,
} from './ast';
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

export function transformList(
  node: OrgListItem,
  parent: OrgValidNode,
  index: number
): void {
  const children = parent.children || [];
  const { indent = 0, name, isOrder } = node;

  const toDeletions: Array<any> = [];
  const listNode: OrgListNode = {
    type: OrgNodeTypes.LIST,
    name,
    isOrder,
    items: [node],
  };
  let current = node
  for (let i = index + 1; i < children.length; i++) {
    const child = children[i];
    if (child.type !== OrgNodeTypes.LIST_ITEM) {
      // 不是列表时，通过检查 indent 决定是不是当前节点的子节点
      // 如果该节点的缩进小于或等于当前list item 说明该列表项结束了
      // 如：非父子关系
      // - list item 1
      // new line text
      // 如：父子关系
      // - list item 2
      //   new line text
      const { indent: childIndent = 0 } = child;
      if (childIndent <= indent) {
        break;
      } else {
        // 存在父子关系，将该节点存放到当前list item 节点的 children
        (current.children = current.children || []).push(child);
        toDeletions.push({ node: child, children, index: i });
      }
    } else {
      current = child
      if (child.name === node.name) {
        // 同一类型的
        listNode.items.push(child)
        toDeletions.push({ node: child, children, index: i })
      }
    }
  }

  // 将 list item 替换成 list 节点
  children.splice(index, index, listNode)

  // 待删除的节点
  if (toDeletions.length) {
    toDeletions.forEach((deletion) => {
      const { children = [], node } = deletion;
      // 可能索引发生的变化，不能直接使用缓存的 Index
      const index = children.indexOf(node)
      index > -1 && children.splice(index, 1);
    });
  }
}

export const transforms = [transformColorText, transformList];
