export const enum NodeTypes {
  ROOT,
  TEXT, // 纯文本
  HEADER, // 标题
  COMMENT, // 注释, #
  ATTRIBUTE, // #+xxx 属性
  PROPERTY, // :name:
  TAG, // :tag1:tag2:
  TIMESTAMP, // <2022-06-21 14:02:38>
  BLOCK, // #+begin...#+end, 代码块
  LINK_OUT, // [[link][decription]], 外部链接
  LINK_INNER, // <<link>> 内部链接，跳转到文档内部
  LINK_RADIO, // <<<target>>>

  // blocks
  BLOCK_INLINE, // 行代码块 ~xx~, =xx=
  BLOCK_SRC, // 代码块
  BLOCK_EXAMPLE,
  BLOCK_EXPORT, // 导出
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

export interface TextNode extends Node {
  type: NodeTypes.TEXT;
  content: string;
}

export interface CommentNode extends Node {
  type: NodeTypes.COMMENT;
  content: string;
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
  title: string;
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
