
export interface ParserOptions {
  
}

export const enum NodeTypes {
  TEXT, // pure text
  PROPERTY, // #+...
  HEADER, // ** ...
  BLOCK, // #+begin...#+end
  INLINE, // =,_,/,+,$
  LIST, // - [-], 1. ...
}

export interface Node {
  type: NodeTypes
  content: string
  children: Node[]
  indent: number
}

export interface TextNode extends Node {
  type: NodeTypes.TEXT
}

export interface PROPERTY extends Node {
  type: NodeTypes.PROPERTY
  name: string
  value: string
}

export interface HEADER extends Node {
  type: NodeTypes.HEADER
  title: string
  level: number
}

export interface Attribute {
  name: string
  value: string
}

export interface BlockNode extends Node {
  type: NodeTypes.BLOCK
  name: string
  language: string
  content: string
  attributes: Array<Attribute>
}

export const enum DoStatus {
  DONE,
  DOING,
  WAITING,
  CANCELLED,
  SCHEDULED
}
export interface ListNode extends Node {
  type: NodeTypes.LIST
  content: string
  isOrder: boolean
  status: DoStatus
}

export const inlineTagList = ['=', '+', '_', '/', '~']
export type InlineTag = '=' | '+' | '_' | '/' | '~'

export interface InlineNode extends Node {
  type: NodeTypes.INLINE
  tag: InlineTag
  children: InlineNode[]
}

export const propertyRE = /^(\s*)#\+(?!begin|end)([\w-_]+)\s*:(.*)$/i
export const headerRE = /^(\*+)\s+(.*)$/i
export const blockRE = /^(\s*)#\+begin_([\w-]+)\s+([\w-]+)\s+(:[^\n]+\n)\s*(.*)#\+end_(\2)/i
export const blockBeginRE = /^(\s*)#\+begin_([\w-]+)\s+([\w-]+)\s+(.*)$/
export const blockEndRE = /^(\s*)#\+end_([\w-]+)$/  
export const unorderListRE = /^(\s*)(?:-|\+|\s\*)\s+(\[[-x ]\]]\s+)?(.*)$/
  export const orderListRE = /^(\s*)(?:\d+)(?:\.|\))\s+(\[[-x ]\]]\s+)?(.*)$/
  

export function baseParse(source: string, options: ParserOptions = {}) {
  const list = source.split(/\\n+/)//.map(row => row.replace(/^[\s\t\f\r\n]+/g, ''))
  
  options;
  
 
  return nodes
 
}
