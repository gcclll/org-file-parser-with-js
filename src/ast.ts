export interface OrgParserOptions {
  onError?: (error: Error) => void;
  extraTextBackground?: boolean | string; // !@%& 组件文本的背景
}

export enum OrgStates {
  DONE = 'DONE',
  DOING = 'DOING',
  WAITING = 'WAITING',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
}

export enum OrgNodeTypes {
  ROOT, // 根节点
  TEXT, // pure text
  PROPERTY, // #+...
  HEADER, // ** ...
  BLOCK, // #+begin...#+end

  EMPHASIS, // =,_,/,+,$,[!&%@]{2}
  LIST, // - [-], 1. ...
  LIST_ITEM,
  TIMESTAMP, // <2022-11-12 Wed 12:00>
  LINK, // external: [[url][name]], inner: <<meta_id>>
  STATE, // TODO, DONE, etc.

  SUB_SUP, // 下标或上标
  COLORFUL_TEXT, // 带颜色的文本
  TABLE, // 表格

  RESULT, // `: hello world` 行文本
}

export interface OrgRootNode {
  type: OrgNodeTypes.ROOT;
  children: OrgValidNode[];
  properties?: OrgAttribute[]; // 页面属性，如：$+title: title value
  footnotes?: OrgFootNode[];
  options?: OrgParserOptions;
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
  | OrgListItem
  | OrgTextChildNode
  | OrgTableNode
  | OrgResultNode;

export interface OrgBaseNode {
  indent?: number;
  content?: string | OrgTextChildNode;
  children?: OrgValidNode[];
}

export type OrgTableRowType = Record<string, string>;

export interface OrgTableColumn {
  label: string;
  prop: string;
}
// 第一行必需是表头，用表头的列内容做为对象的 key
// 如：|name|value|
//     |cat|100|
// 结果：[['name', 'value], ['cat', '100']]
//
export interface OrgTableNode extends OrgBaseNode {
  type: OrgNodeTypes.TABLE;
  nodes: OrgTableRowType[];
  columns: Array<OrgTableColumn>;
  rows: number;
  name?: string;
}

export interface OrgStateNode extends OrgBaseNode {
  type: OrgNodeTypes.STATE;
  state: OrgStates;
}

export interface OrgPairNode<T> extends OrgBaseNode {
  name: string;
  value: T;
}

export interface OrgResultNode extends OrgBaseNode {
  type: OrgNodeTypes.RESULT;
  values: string[];
}

export interface OrgFootNode extends OrgPairNode<string> {}

export interface OrgTextNode extends OrgBaseNode {
  type: OrgNodeTypes.TEXT;
}

export type OrgBadgeStyle =
  | 'flat'
  | 'plastic'
  | 'flat-square'
  | 'for-the-badge'
  | 'social';
// 包含属性查看 https://shields.io/endpoint
// 支持的 icons: https://simpleicons.org/
export interface OrgBadgeType {
  message: string; // 右边的文字
  color: string;
  schemaVersion: number;
  messageLink?: string;
  label?: string; // 左边的文字
  labelColor?: string;
  labelLink?: string;
  logo?: string; // 左边开头的图标
  logoColor?: string;
  logoWidth?: number;
  style?: string;
  url?: string;
}

export interface OrgColorfulTextNode extends OrgBaseNode {
  type: OrgNodeTypes.COLORFUL_TEXT;
  color: string;
  badge?: OrgBadgeType;
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

export type OrgScriptSign = '_' | '^';
export interface OrgSubSupNode extends OrgBaseNode {
  type: OrgNodeTypes.SUB_SUP;
  sign: OrgScriptSign;
  target: string;
  value: string | OrgTextNode; // maybe colorful/emphasis node
  sub?: boolean;
  sup?: boolean;
}

export interface OrgPropertyNode extends OrgPairNode<string | boolean> {
  type: OrgNodeTypes.PROPERTY;
}

export interface OrgClockValue {
  start: OrgTimestamp | string;
  end?: OrgTimestamp | string;
  duration?: string;
}

export type OrgHeaderProperty = OrgPairNode<OrgHeaderPropertyValue> & {
  category?: string;
};
export type OrgHeaderPropertyValue = string | OrgTimestamp | OrgClockValue;
export interface OrgHeaderNode extends OrgBaseNode {
  type: OrgNodeTypes.HEADER;
  title: string | OrgTextChildNode;
  level: number;
  tags?: string[];
  properties?: OrgHeaderProperty[];
}

export interface OrgAttribute extends OrgPairNode<string | boolean> {
  category?: string;
}

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
  result?: OrgBlockNode | OrgResultNode;
}

export declare type OrgListItemState = ' ' | '-' | 'x' | 'X';

export interface OrgListItem extends OrgBaseNode {
  type: OrgNodeTypes.LIST_ITEM;
  state: OrgListItemState;
  name: string;
  isOrder: boolean;
}

export interface OrgListNode extends OrgBaseNode {
  type: OrgNodeTypes.LIST;
  name: string; // 无序：-/+, 有序：1)/a)/1./a.
  isOrder: boolean; // 有序列表/无序列表
  items: OrgListItem[];
  attrs?: Record<string, string>;
}

export enum InlineEmphasisSign {
  CODE_EQUAL = '=',
  CODE_WAVE = '~',
  LINE_THROUGH = '+',
  UNDERLINE = '_',
  ITALIC = '/',
  BOLD = '*',
  LATEX = '$',
  ANGLE = '<',
}

export interface OrgEmphasisNode extends OrgBaseNode {
  type: OrgNodeTypes.EMPHASIS;
  sign: InlineEmphasisSign;
  extra?: boolean;
  background?: boolean | string; // 需不需要显示背景
}

export const SIGN_SUB = '_';
export const SIGN_SUP = '^';
