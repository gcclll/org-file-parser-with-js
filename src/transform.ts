import {
  OrgEmphasisNode,
  OrgListNode,
  OrgValidNode,
  OrgNodeTypes,
  OrgBadgeType,
} from './ast';
import { isString, assign, buildUrlParam } from './utils';
import { colorTextRE } from './regexp';
import { parseEmphasisNode } from './emphasis';
import { getInterpo } from './interpolation';
import { throwError, OrgErrorCodes } from './error';

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
  node: OrgValidNode,
  parent: OrgValidNode,
  index: number
): void {
  if (node.type !== OrgNodeTypes.LIST_ITEM) {
    return;
  }

  const children = parent.children || [];
  const { indent = 0, name, isOrder } = node;

  const toDeletions: Array<any> = [];
  const listNode: OrgListNode = {
    type: OrgNodeTypes.LIST,
    name,
    isOrder,
    items: [node],
  };
  let current = node,
    prevNode = children[index - 1];

  // 可以为该列表增加一些属性
  if (
    prevNode?.type === OrgNodeTypes.PROPERTY &&
    prevNode.name.toLowerCase() === 'list_attr'
  ) {
    const { value = '' } = prevNode;
    if (typeof value === 'string') {
      listNode.attrs = value.split(';').reduce((result, curr) => {
        if (curr) {
          const [name, value] = (curr || '').split('=');
          result[name] = value;
        }
        return result;
      }, {} as Record<string, string>);
    }
    toDeletions.push({ node: prevNode, children, index: index - 1 });
  }

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
      current = child;
      const push = () => {
        listNode.items.push(child);
        toDeletions.push({ node: child, children, index: i });
      };
      if (isOrder) {
        // 有序列表的 name 是不同的，应该是递增的(a->b, 1->2, i->ii, ...)
        // 目前只支持 1. ... 和 a. 或 1) 和 a) 形式的列表
        if (/[0-9]+/.test(name) && /[0-9]+/.test(child.name)) {
          if (+child.name - +name >= 1) {
            // 1. xxx 2. yyy, 或 1. xxx 3. yyy
            push();
          } else {
            // 3. xxx 1.yyy -> 重新开始
            break;
          }
        } else if (/[a-zA-Z]/.test(name) && /[a-zA-Z]/.test(child.name)) {
          if (child.name > name) {
            // a) xxx b) yyy
            push();
          } else {
            break;
          }
        }
      } else {
        // 无序列表直接判断 name 就行，如： - xxx \n - yyy
        if (child.name === node.name) {
          // 同一类型的
          push();
        }
      }
    }
  }

  // 将 list item 替换成 list 节点
  children.splice(index, 1, listNode);

  // 待删除的节点
  if (toDeletions.length) {
    toDeletions.forEach((deletion) => {
      const { children = [], node } = deletion;
      // 可能索引发生的变化，不能直接使用缓存的 Index
      const index = children.indexOf(node);
      index > -1 && children.splice(index, 1);
    });
  }
}

export function transformBlockResult(
  node: OrgValidNode,
  parent: OrgValidNode,
  index: number
): void {
  // 必须是 #+RESULT:
  if (node.type === OrgNodeTypes.PROPERTY && node.name === 'RESULT') {
    const children = parent.children || [];
    if (children.length === 0) return;

    // 自身也要合并到对应的 block 中去
    const toDeletions: Array<any> = [{ node, children, index }];

    // 没有对应的代码块，视为无效的结果
    const prevNode = children[index - 1];
    if (!prevNode || prevNode.type !== OrgNodeTypes.BLOCK) {
      return;
    }

    // 结果可能是 block 也可能是 result 节点
    const nextNode = children[index + 1];

    if (
      nextNode &&
      (nextNode.type === OrgNodeTypes.RESULT ||
        nextNode.type === OrgNodeTypes.BLOCK)
    ) {
      prevNode.result = nextNode;
      toDeletions.push({ node: nextNode, children, index: index + 1 });
    }

    toDeletions.forEach((deletion) => {
      const { node, children } = deletion;
      const idx = children.indexOf(node);
      idx > -1 && children.splice(idx, 1);
    });
  }
}

export function transformInterpolations(
  node: OrgValidNode,
  parent: OrgValidNode,
  index: number
): void {
  if (node.type === OrgNodeTypes.INTERPOLATION) {
    const ast = getInterpo(node.key);

    if (ast) {
      // 替换插值成对应的 ast
      parent.children?.splice(index, 1, ast);
    }
  }
}

// <badge:gccll|homepage|/|vue> 会被解析成两部分，前面是
// gccll|home| 后面 / 会被解析成 EMPHASIS，这里将它当作文本合并到前者去
export function transformColorBadge(
  node: OrgValidNode,
  _: OrgValidNode,
  __: number
): void {
  if (node.type === OrgNodeTypes.COLORFUL_TEXT && node.color === 'badge') {
    const children = node.children || [];
    const first = children[0];
    if (first && first.type === OrgNodeTypes.TEXT) {
      if (first.children?.length === 1) {
        // 直接当作纯文本，交给使用都去处理
        delete first.children;
      }

      for (let i = 1; i < children.length; i++) {
        const child = children[i];
        if (child) {
          if (child.type === OrgNodeTypes.EMPHASIS) {
            // 处理 `/` 特殊字符
            first.content += child.sign;
            if (child.children) {
              if (child.children.length > 0) {
                child.children.forEach((c) => {
                  if (isString(c.content)) {
                    first.content += (c.content as string) || '';
                  }
                });
              }
            }
          } else if (isString(child.content)) {
            first.content += child.content as string;
          }
        }
      }

      // 删除后面的 children
      children.splice(1);

      // gccll|homepage|green|/|vue 将每项根据对应关系解析出来
      // 对应关系：left-message|right-message|right-color|/|logo
      if (isString(first.content)) {
        const content = first.content as string;
        node.badge = buildBadgeJSON(content);
      }
    }
  }
}

function trim2Arr(s: string, splitter: string = '|'): string[] {
  return !s
    ? []
    : s
        .trim()
        .split(splitter)
        .map((s) => s.trim())
        .filter(Boolean);
}

export function buildBadgeJSON(content: string): OrgBadgeType | undefined {
  const [left, right, links] = content.split(/\|\s*\/\s*\|/) || [];
  let leftList = trim2Arr(left);
  let rightList = trim2Arr(right);
  let linkList = trim2Arr(links);
  const ln = leftList.length;
  // 处理左边的格式，完整格式：label | labelColor | message | green
  if (ln < 2) {
    throwError(OrgErrorCodes.ERROR_BADGE_LESS_ARGS);
    // 必须要有 message 和 color
    return;
  } else if (ln === 2) {
    // [message, color]
    leftList = ['', '', ...leftList];
  } else if (ln === 3) {
    // [label, message, color]
    leftList.splice(1, 0, '');
  }

  const [label, labelColor, message, color] = leftList;
  const [logo, logoColor = ''] = rightList;
  // message link 在前面，因为 label 不一定有，message 必须存在
  const [messageLink, labelLink] = linkList;
  let badge: OrgBadgeType | undefined;
  if (message && color) {
    badge = {
      type: OrgNodeTypes.BADGE,
      message,
      color,
      schemaVersion: 1,
      messageLink,
      label,
      labelColor,
      labelLink,
      logo,
      logoColor,
      useObject: !!(messageLink || labelLink),
    };
    // 直接构建成badge url
    badge.url = buildBadgeUrl(badge);
  }

  return badge;
}

function buildBadgeUrl(badge: OrgBadgeType) {
  const url = 'https://img.shields.io/static';
  const { schemaVersion, messageLink, labelLink, ...params } = badge;
  const query = buildUrlParam(params as any, true);
  const leftLink = messageLink ? `&link=${messageLink}` : '';
  const rightLink = labelLink ? `&link=${labelLink}` : '';
  return `${url}/v${schemaVersion}?${query}` + leftLink + rightLink;
}

export const normalTransforms = [
  transformList,
  transformBlockResult,
  // transformColorBadge,
  // 使用插值之后就不再需要上面的 transformColorBadge 了，
  // 因为 <badge:...> 会在解析之前就被替换成插值，等所有的文本解析完成之后
  // 使用这个 transform 直接去替换掉即可
  transformInterpolations,
];
