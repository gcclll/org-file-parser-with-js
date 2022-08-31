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
export const extLinkRE = /\[\[([^[\]]+)](?:\[([^[\]]+)])?\]/g;
export const extLinkXRE = /^\[\[([^[\]]+)](?:\[([^[\]]+)])?\]/;
export const innerLinkRE = /<<([^<>]+)>>/g;
export const innerLinkXRE = /^<<([^<>]+)>>/;
export const emphasisRE =
  /([=~\+_/\$\*]|[!&%@][!&%@])(?=[^\s])([^\1]+?\S)(?:\1)/g;
export const timestampRE = /\<(\d{4}-\d{2}-\d{2}\s+[^>]+)>/gi; // check timestamp re
export const timestampXRE = /^\<(\d{4}-\d{2}-\d{2}\s+[^>]+)>/i; // check timestamp re
// 增加支持emphasis,colorful 上下标
export const subSupRE = /([\w-]+)(\^|_){([<\w-=:~\+/*>]+)}/gi;
export const subSupXRE = /^([\w-]+)(\^|_){([<\w-=:~\+/*>]+)}/;

// table regexp
export const tableRowRE = /^(\s*)\|(.*?)\|$/;
export const tableRowLineRE = /^(\s*)\|[+-]+\|$/;

const colorNameREStr = `[a-zA-Z]+|#[0-9a-e]{3}|#[0-9a-e]{6}`;

export const colorfulTextRE = new RegExp(
  `<(${colorNameREStr}):([^<>]+)>`,
  'gi'
);

// TODO 不支持太复杂的嵌套，如：_u1 <red:underline /it<red:a>lic/ c2> u2_
// 其中的 <red:a> 就解析不出来
export const colorfulTextXRE = new RegExp(
  `^<(${colorNameREStr}):([^<>]+)>`,
  'i'
);
// FIX: 支持完整字符串为: `red:text` 格式
export const colorfulBareTextRE = new RegExp(
  `(\\s+${colorNameREStr}):([^\\s<>]+)\\s+`,
  'gi'
);

const states = ['TODO', 'DONE', 'CANCELLED'];
export const stateRE = new RegExp(`(${states.join('|')})`, 'g');
export const stateXRE = new RegExp(`^(${states.join('|')})`);
