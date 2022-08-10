const isArray = Array.isArray

const NodeTypes = {
  TEXT: 1,
  UNDERLINE: 2,
  COLOR: 3,
  ELEMENT: 4,
}

const tagMap = {
  _: '_',
  '<': '>',
  '+': '+'
}

function last(a) {
  return a[a.length - 1];
}

function isStartTag(ch) {
  return Object.keys(tagMap).includes(ch)
}

function isEndTag(ch) {
  return Object.values(tagMap).includes(ch)
}

function parse(content) {
  content = `${content}   `
  const context = { originalSource: content, source: content }
  const root = { type: 'root', children: [] }
  root.children = parseChildren(context, [])
  return root
}

function parseChildren(context, ancestors) {
  const parent = last(ancestors)
  const nodes = []

  while (!isEnd(context, ancestors)) {
    const s = context.source
    let node

    if (isStartTag(s[0]) && s[1] !== ' ') {
      node = parseElement(context, ancestors)
    } else if (isEndTag(s[0])) {
      context.source = context.source.slice(1)
      continue
    }

    if (!node) {
      node = parseText(context)
    }

    if (isArray(node)) {
      for (let i = 0; i < node.length; i ++) {
        pushNode(nodes, node[i])
      }
    } else {
      pushNode(nodes, node)
    }
  }

  return nodes
}

const TagType = {
  Start: 1,
  End: 2
}
function parseElement(context, ancestors) {
  const parent = last(ancestors)
  const s = context.source
  const tag = s[0]
  context.source = s.trimStart().slice(1)
  const element = {
    type: NodeTypes.ELEMENT,
    tag,
    children: []
  }

  // children
  ancestors.push(element)
  const children = parseChildren(context, ancestors)
  ancestors.pop()

  element.children = children

  const endTag = tagMap[element.tag]

  if (startsWith(context.source, endTag)) {
    context.source = context.source.slice(1)
  }

  return element
}

const endTokens = [...new Set([...Object.values(tagMap), ...Object.keys(tagMap)])]
function parseText(context) {
  const s = context.source
  let endIndex = s.length

  for (let i = 0; i < endTokens.length; i++) {
    const index = s.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = s.slice(0, endIndex)
  context.source = s.slice(endIndex)

  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function pushNode(nodes, node) {
  nodes.push(node)
}

function isEnd(context, ancestors) {
  const s = context.source
  const tags = Object.entries(tagMap)
  for (let i = 0; i < tags.length; i++) {
    const [start, end = start] = tags[i]
    if (checkIsEnd(s, ancestors, start, end)) {
      return true
    }
  }

  return !s
}

function checkIsEnd(s, ancestors, startTag, endTag = startTag) {
  if (startsWith(s, endTag)) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (ancestors[i].tag === startTag) {
        return true
      }
    }
  }
  return false
}

function startsWith(s1, s2) {
  return s1.startsWith(s2)
}

let s = `_text1 <red:emphasis1- +emphasis2+ -emphasis3> text2_`
// s = `_text1 text2_`
s = `_text1 <red:emphasis1-emphasis2> text2_`

const ast = parse(s);

console.log(ast);
