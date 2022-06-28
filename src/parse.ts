
export const isArray = Array.isArray

export interface ParserOptions {
  
}

export const enum NodeTypes {
  TEXT, // pure text
  PROPERTY, // #+...
  HEADER, // ** ...
  BLOCK, // #+begin...#+end
  EMPHASIS, // =,_,/,+,$
  LIST, // - [-], 1. ...
  
  // 各称链接
  EXTERNAL_LINK, // [[url][name]]
  INNER_LINK, // <<meta_id>>
}

export interface Node {
  type: NodeTypes
  content: string
  indent: number
  index: number
  children?: Node[]
  tags?: string[]
}

export interface TextNode extends Node {
  type: NodeTypes.TEXT
}

export interface PropertyNode extends Node {
  type: NodeTypes.PROPERTY
  name: string
  value: string
}

export interface HeaderNode extends Node {
  type: NodeTypes.HEADER
  title: string
  level: number
}

export interface Attribute {
  name: string
  value: string
}

export interface ExternalLinkNode extends Node {
  type: NodeTypes.EXTERNAL_LINK
  content: string
  url: string
  description?: string
}

export interface InnerLinkNode extends Node {
  type: NodeTypes.INNER_LINK
  content: string
  id: string
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

export interface EmphasisNode extends Node {
  type: NodeTypes.EMPHASIS
  tag: InlineTag
  children: EmphasisNode[]
}

export const propertyRE = /^(\s*)#\+(?!begin|end)([\w-_]+)\s*:(.*)$/i
export const headerRE = /^(\*+)\s+(.*)$/i
export const blockRE = /^(\s*)#\+begin_([\w-]+)\s+([\w-]+)\s+(:[^\n]+\n)\s*(.*)#\+end_(\2)/i
export const blockBeginRE = /^(\s*)#\+begin_([\w-]+)\s+([\w-]+)\s+(.*)$/
export const blockEndRE = /^(\s*)#\+end_([\w-]+)$/  
export const unorderListRE = /^(\s*)(?:-|\+|\s\*)\s+(\[[-x ]\]]\s+)?(.*)$/
export const orderListRE = /^(\s*)(?:\d+)(?:\.|\))\s+(\[[-x ]\]]\s+)?(.*)$/
export const extLinkRE = /\[\[([^[\]]+)](?:\[([^[\]]+)])?\]/g
export const innerLinkRE = /<<([^<>]+)>>/g
export const emphasisRE = /([=~\+_/])(?=[^\s])(.*)[^\s](?:\1)/g

export function baseParse(source: string, options: ParserOptions = {}) {
  const list = source.split(/\n+/)//.map(row => row.replace(/^[\s\t\f\r\n]+/g, ''))
  
  options; list;

  const nodes: any = list.map((content, i) => {
    return parseNode(content, i)
  })
  
  return nodes
}

export function parseNode(content: string, index: number) {
  let node: any
  
  if (propertyRE.test(content)) {
    node = parseProperty(content, index)
  } else if (headerRE.test(content)) {
    node = parseHeader(content, index)
  }
  
  if (!node) {
    node = parseText(content, index)
  }
  
  return node
}

// 解析标题
export function parseHeader(source: string, index: number): HeaderNode | null {
  const { content, tags } = parseTags(source)
  
  const matched = content.match(headerRE)
  
  if (matched == null) {
    return null
  }
  
  const [text, stars, title] = matched
  
  return {
    type: NodeTypes.HEADER,
    content: text,
    title,
    index,
    indent: 0,
    tags,
    level: stars.length,
  }
}

// 解析属性
export function parseProperty(content: string, index: number): PropertyNode | null {
  const matched = content.match(propertyRE)
  if (matched) {
    const [content, indent, name, value] = matched || []
    return {
      type: NodeTypes.PROPERTY,
      content,
      indent: (indent || '').length,
      name,
      value,
      index
    }
  }
  
  return null
}

// 解析文本
export function parseText(content: string, index: number): TextNode | null {
  const matched = content.match(/^(\s+)/)
  let indent = 0
  if (matched) {
    indent = matched[1].length
  }
  
  return {
    type: NodeTypes.TEXT,
    content: content.trim(),
    indent,
    index
  }
}

function parseTags(content: string): { 
  content: string 
  tags: string[]
} {
  const tagRE = /:(.*):/gi
  let matched: string[] | null = null
  let tags: string[] = []
  if (content == '') {
    matched = null
  } else if ((matched = content.match(tagRE))) {
    const value = matched[0]
    // remove matched tags from header
    content = content.replace(value, '')
    tags = value.replace(/^:|:$/, '').split(':').filter(Boolean)
  }
  
  return {
    tags,
    content
  }
}
