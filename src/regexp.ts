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
export const pureLinkRE = /^\s*(https?|file):\/\/[^\s]+/
export const innerLinkRE = /<<([^<>]+)>>/g;
export const innerLinkXRE = /^<<([^<>]+)>>/;
export const emphasisRE =
  /([=~\+_/\$\*]|[!&%@][!&%@])(?=[^\s])([^\1]+?\S)(?:\1)/g;
export const timestampXRE = /^<(\d{4}-\d{2}-\d{2}([\w\s\-+:]+)?)>/i; // check timestamp re
// 增加支持emphasis,colorful 上下标
export const subSupRE = /([\w-]+)(\^|_){([<\w-=:~\+/*>]+)}/gi;
export const subSupXRE = /^([\w-]+)(\^|_){([<\w-=:~\+/*>]+)}/;

// table regexp
export const tableRowRE = /^(\s*)\|(.*?)\|$/;
export const tableRowLineRE = /^(\s*)\|[+-]+\|$/;

// result line, eg. `: hello world`, 一般跟在 #+RESULT: 后面
export const resultLineRE = /^\s*:\s(.*)/

const colorNameREStr = `[a-zA-Z]+|#[0-9a-e]{3}|#[0-9a-e]{6}`;

// shit????????????, global 用来遍历找出结果，无global的用来检查是否匹配正则
export const colorTextRE = {
  // 找出所有 <red:text> 文本时使用
  angleGlobal: new RegExp(`<(${colorNameREStr}):([^<>]+)>`, 'gi'),
  // 在检查是不是 `<red:text .. bala...>` 开头的文本
  angleBegin: new RegExp(`^<(${colorNameREStr}):([^<>]+)>`, 'i'),
  // 找出所有 `xxx red:text-...` 文本时使用
  bareGlobal: new RegExp(`(\\s+${colorNameREStr}):([^\\s<>]+)\\s+`, 'gi'),
  // 找出所有 `red:text...` 开头的文本
  bareBeginGlobal: new RegExp(`^(${colorNameREStr}):([^\\s<>]+)\\s+`, 'gi'),
  // 检查是不是 `red:text... text ...` 开头的文本
  bareBegin: new RegExp(`^(${colorNameREStr}):([^\\s<>]+)\\s+`, 'i'),
};

const states = ['TODO', 'DONE', 'CANCELLED'];
export const stateRE = new RegExp(`(${states.join('|')})`, 'g');
export const stateXRE = new RegExp(`^(${states.join('|')})`);
