export const enum NodeTypes {
  ROOT,
  TEXT, // 纯文本
  HEADER, // 标题
  COMMENT, // 注释, #
  ATTRIBUTE, // #+xxx 属性
  LIST, // 列表
  PROPERTY, // :name:
  TAG, // :tag1:tag2:
  TIMESTAMP, // <2022-06-21 14:02:38>
  BLOCK, // #+begin...#+end, 代码块
  LINK_OUT, // [[link][decription]], 外部链接
  LINK_INNER, // <<link>> 内部链接，跳转到文档内部
  LINK_RADIO, // <<<target>>>
}

export interface Node {
  type: NodeTypes;
  loc: SourceLocation;
}

export type TemplateChildNode = any;

export interface RootNode extends Node {
  type: NodeTypes.ROOT;
  children: TemplateChildNode[];
  todos: Node[];
}

export type BlockName = 'src' | 'example' | 'export'
export interface BlockProp {
  name: string
  value: string    
}                                             

export interface BlockNode extends Node {
  type: NodeTypes.BLOCK
  name: BlockName
  content: string
  language: string
  props: BlockProp[]
}

export interface TextNode extends Node {
  type: NodeTypes.TEXT;
  content: string;
}

export interface CommentNode extends Node {
  type: NodeTypes.COMMENT;
  content: string;
}

// 列表状态 
// - [-] DOSING
// - [x] DONE
export enum ListItemStatus {
  DONE,                         // [x]
  DOING,                        // [-]
}

export interface ListNode extends Node {
  type: NodeTypes.LIST
  list: Node[]
  orderly: boolean              // 有序(n.) - true, 无序(-) - false
  status: ListItemStatus
  children: TemplateChildNode[]
}

export interface AttributeNode extends Node {
  type: NodeTypes.ATTRIBUTE;
  name: string;
  value: TextNode | undefined;
}

export interface PropertyNode extends Node {
  type: NodeTypes.PROPERTY;
  name: string;
  value: TextNode | undefined;
}

export interface TagNode extends Node {
  type: NodeTypes.TAG;
  name: string;
  value: TextNode | undefined;
}

export interface HeaderNode extends Node {
  type: NodeTypes.HEADER;
  content: string;
  children: Node[];
  level: number;
}

export interface TimestampNode extends Node {
  type: NodeTypes.TIMESTAMP;
  name: string;
  value: TextNode | undefined;
}

export function createRoot(children: TemplateChildNode[]) {
  return {
    type: NodeTypes.ROOT,
    children,
    todos: [],
  };
}

export interface SourceLocation {
  start: Position;
  end: Position;
  source: string;
}

export interface Position {
  offset: number;
  line: number;
  column: number;
}
