# CHANGELOG

## 2022-07-19

### Bugs

- content do not include sign [#25105e7](https://github.com/gcclll/org-file-parser-with-js/commit/9a8c1892f1e8bb4f5542aa0dc928187ac25105e7)

## 2022-06-30

### Bugs

- block can't be parsed correctly without attribute, [#0edc204](https://github.com/gcclll/org-file-parser-with-js/commit/0edc2045b9abe4d70aaa11805c5d236ab9fe9663)

# TODOs

* [x] Header, `* header`

  * [x] Tags, `* header1 :tag1:tag2:`

  * [x] Properties

  * [x] parse header title as text, use `parseText()`

    `* TODO header1 :tag1:tag2` =>

    ```json
    {
      type: NodeTypes.HEADER,
      content: {
        type: NodeTypes.TEXT,
        children: [
          { type: NodeTypes.STATE, content: 'TODO' }
          { type: NodeTypes.TEXT, content: 'header1' }
        ]
      },
    	tags: ['tag1', 'tag2']
    }
    ```

* [x] Text

  * [x] Colorful text, `<red:text1 text2>` or `red:text1text2`
    * [ ] TODO Support emphasis text, `<red:text1 _text2_>`

* [x] Attribute, `#+title: org-file-parser-with-js`

* [x] Emphasis, `~~, ==, ++, __, //, $$`

  * [x] [extra]( https://emacsnotes.wordpress.com/2022/06/29/use-org-extra-emphasis-when-you-need-more-emphasis-markers-in-emacs-org-mode/) : `!!, !@, !%, !&, @!, @@, @%, @&, %!, %@, %%, %&, &!, &@, &%, &&`

* [x] [Date & Times](https://orgmode.org/manual/Dates-and-Times.html#Dates-and-Times)

* [x] [Images](https://orgmode.org/manual/Images.html)

* [x] Subscripts and Superscripts

* [ ] List

  * [x] Unordered lists, `-, +, * `
  * [x] Ordered lists, `1. 1)`
  * [ ] List children parsing

* [x] Blocks, `#+begin_xxx ... #end_xxx`

  * [x] block attributes, `:result both :noweb yes`

    ```json
    // :result both :noweb yes =>
    [
      { name: 'result', value: 'both' },
      { name: 'noweb', value: 'yes' }
    ]
    ```

  * [x] block options, `-n 20 -r`

    ```json
    // -n 20 -r =>
    [
      { name: 'n', value: '20' },
      { name: 'r', value: '' }
    ]
    ```

* [ ] [Links](https://orgmode.org/manual/Hyperlinks.html#Hyperlinks), `[[link][desc]], [[link]], <<inner-link>>`

  * [x] [External link](https://orgmode.org/manual/External-Links.html) `[[url][desc]]`

    Support link types: **file**，**attachment**，**bbdb**，**docview**，**doi**，**gnus**，**elisp**，**gnus**，**rmail**，**mhe**，**help**，**http**，**https**，**id**，**info**，**irc**，**mailto**，**news**，**shell**，etc.

    more details to -> https://orgmode.org/manual/External-Links.html

  * [x] Inner link, `<<inner-link>>`

    It is an inner link meta. Eg. 

    ```
    1. one item
    2. <<target>>another item
    Here we refer to item [[target]].
    ```

    So, inner link(`<<target>>`) is related to a external link(`[[target]]`)

  * [ ] Triple argular brackets `<<<radio link>>>`

  * [x] Link Abbreviations

    This will only support `#+LINK: abrrev https://....`, do not support **Emacs Lisp** variables.

* [x] TODO, DONE, etc. keywords

* [ ] Table

# Usage

**Installation**:

`$ npm install -D org-file-parser-with-js`

**Code**:

```js
const { baseParse } = rquire('org-file-parser-with-js')
// or import { baseParse } from 'org-file-parser-with-js'

const json = baseParse(`...org file content`)

// Result Example:

```

Example(`demo.org`)

```org
#+title: test
#+author: gcclll
#+email: gccll.love@gmail.com


I'am test test!!!!

* header1-1 :test:bbb:ccc:
header1 content

** header2-1

Header2-1 content 1

#+test: header2 attribute

Header2-1 content 2

Header2-1 content 3

* emphasis node

Functions =inserting= links (~see~ Handling +Links+) properly escape ambiguous characters. You only need to bother about the rules above when inserting directly, or yanking, a URI within square brackets. When in doubt, you may use the function org-link-escape, ~which~ turns a +link+ string /into/ its _escaped_ form.

Once a link in the buffer is complete, with all brackets present, Org changes the display so that ‘DESCRIPTION’ is displayed instead of ‘[[LINK][DESCRIPTION]]’ and ‘LINK’ is displayed instead of ‘[[LINK]]’. Links are highlighted in the org-link face, which, by default, is an underlined face.
```

Result Example JSON:

```json
[
    {
        "type": 2,
        "content": "#+title: test",
        "indent": 0,
        "name": "title",
        "value": " test",
        "index": 0
    },
    {
        "type": 2,
        "content": "#+author: gcclll",
        "indent": 0,
        "name": "author",
        "value": " gcclll",
        "index": 1
    },
    {
        "type": 2,
        "content": "#+email: gccll.love@gmail.com",
        "indent": 0,
        "name": "email",
        "value": " gccll.love@gmail.com",
        "index": 2
    },
    {
        "type": 1,
        "content": "I'am test test!!!!",
        "children": [
            {
                "type": 1,
                "content": "I'am test test!!!!"
            }
        ],
        "indent": 0,
        "index": 3
    },
    {
        "type": 3,
        "content": "* header1-1 ",
        "title": "header1-1 ",
        "index": 4,
        "indent": 0,
        "tags": [
            "test",
            "bbb",
            "ccc"
        ],
        "level": 1
    },
    {
        "type": 1,
        "content": "header1 content",
        "children": [
            {
                "type": 1,
                "content": "header1 content"
            }
        ],
        "indent": 0,
        "index": 5
    },
    {
        "type": 3,
        "content": "** header2-1",
        "title": "header2-1",
        "index": 6,
        "indent": 0,
        "tags": [],
        "level": 2
    },
    {
        "type": 1,
        "content": "Header2-1 content 1",
        "children": [
            {
                "type": 1,
                "content": "Header2-1 content 1"
            }
        ],
        "indent": 0,
        "index": 7
    },
    {
        "type": 2,
        "content": "#+test: header2 attribute",
        "indent": 0,
        "name": "test",
        "value": " header2 attribute",
        "index": 8
    },
    {
        "type": 1,
        "content": "Header2-1 content 2",
        "children": [
            {
                "type": 1,
                "content": "Header2-1 content 2"
            }
        ],
        "indent": 0,
        "index": 9
    },
    {
        "type": 1,
        "content": "Header2-1 content 3",
        "children": [
            {
                "type": 1,
                "content": "Header2-1 content 3"
            }
        ],
        "indent": 0,
        "index": 10
    },
    {
        "type": 3,
        "content": "* emphasis node",
        "title": "emphasis node",
        "index": 11,
        "indent": 0,
        "tags": [],
        "level": 1
    },
    {
        "type": 1,
        "content": "Functions =inserting= links (~see~ Handling +Links+) properly escape ambiguous characters. You only need to bother about the rules above when inserting directly, or yanking, a URI within square brackets. When in doubt, you may use the function org-link-escape, ~which~ turns a +link+ string /into/ its _escaped_ form.",
        "children": [
            {
                "type": 1,
                "content": "Functions "
            },
            {
                "type": 5,
                "tag": "=",
                "content": "inserting"
            },
            {
                "type": 1,
                "content": " links ("
            },
            {
                "type": 5,
                "tag": "~",
                "content": "see"
            },
            {
                "type": 1,
                "content": " Handling "
            },
            {
                "type": 5,
                "tag": "+",
                "content": "Links"
            },
            {
                "type": 1,
                "content": ") properly escape ambiguous characters. You only need to bother about the rules above when inserting directly, or yanking, a URI within square brackets. When in doubt, you may use the function org-link-escape, "
            },
            {
                "type": 5,
                "tag": "~",
                "content": "which"
            },
            {
                "type": 1,
                "content": " turns a "
            },
            {
                "type": 5,
                "tag": "+",
                "content": "link"
            },
            {
                "type": 1,
                "content": " string "
            },
            {
                "type": 5,
                "tag": "/",
                "content": "into"
            },
            {
                "type": 1,
                "content": " its "
            },
            {
                "type": 5,
                "tag": "_",
                "content": "escaped"
            },
            {
                "type": 1,
                "content": "Functions =inserting= links (~see~ Handling +Links+) properly escape ambiguous characters. You only need to bother about the rules above when inserting directly, or yanking, a URI within square brackets. When in doubt, you may use the function org-link-escape, ~which~ turns a +link+ string /into/ its _escaped_ form."
            }
        ],
        "indent": 0,
        "index": 12
    },
    {
        "type": 1,
        "content": "Once a link in the buffer is complete, with all brackets present, Org changes the display so that â€˜DESCRIPTIONâ€™ is displayed instead of â€˜[[LINK][DESCRIPTION]]â€™ and â€˜LINKâ€™ is displayed instead of â€˜[[LINK]]â€™. Links are highlighted in the org-link face, which, by default, is an underlined face.",
        "children": [
            {
                "type": 1,
                "content": "Once a link in the buffer is complete, with all brackets present, Org changes the display so that â€˜DESCRIPTIONâ€™ is displayed instead of â€˜[[LINK][DESCRIPTION]]â€™ and â€˜LINKâ€™ is displayed instead of â€˜[[LINK]]â€™. Links are highlighted in the org-link face, which, by default, is an underlined face."
            }
        ],
        "indent": 0,
        "index": 13
    },
    {
        "type": 1,
        "content": "",
        "children": [],
        "indent": 0,
        "index": 14
    }
]
```

# APIs

## Types

```typescript
export const enum NodeTypes {
  ROOT, // 根节点
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
```

## Parse Functions

### baseParse

the entry function.

```typescript
export function baseParse(
  source: string,
  options: ParserOptions = {
    onError: (error: Error) => console.warn(error),
  }
)
```

usage:

```typescript
const ast = baseParse(`
#+title: test
....`/*org file content*/)
// ast => [{ type, content, ... }, ...]
```

### parseNode()

```typescript
export function parseNode(content: string, list: string[], index: number): BlockNode | null
```

used to parse the list read from xx.org file line by line.

### parseList()

```typescript
export const enum OrgDoStatus {
  DONE,
  DOING,
  WAITING,
  CANCELLED,
  SCHEDULED,
}
export interface OrgListNode extends OrgNode {
  type: OrgNodeTypes.LIST;
  content: string;
  isOrder: boolean;
  state: OrgListItemState;
  tag: string;
}
```

### parseBlock()

```typescript
export function parseBlock(
  content: string,
  list: string[],
  index: number
): BlockNode | null
```

parse the block node, contains:

```
#+begin_xxx <language> <properties>
#+end_xxx
```

### parseCLIOption()

```typescript
 function parseCLIOption(str: string): BlockOptions
```

parse the cli options, used for `parseBlock()`

`#+begin_src emacs-lisp -n -r` =>

```json
{
  n: '', // if -n 20 -r, value is '20' here
  r: ''
}
```

### parseHeader()

```typescript
export function parseHeader(source: string, index: number): HeaderNode | null
```

parse the header in org file, eg. `* header level 1`, `** header level 2`

### parseProperty()

```typescript
export function parseProperty(
  content: string,
  index: number
): PropertyNode | null
```

parse the property in whole org file, formt: `$+name: property value`, eg. `#+title: org`

### parseText()

```typescript
export function parseText(content: string, index: number): TextNode
```

parse the main body under headers or beginning of org file.

eg.

```
test1 ~code~ test2 =code2=
```

it will parse the text upon to four nodes.

Node[0] is `test1`

Node[1] is `~code~`

Node[2] is `test2`

Node[3] is `=code2=`

They will be append to `node.children[...Node]`

So, you can parse the `node.children` and concat the parsed ast result to show the whole paragraph text.

### parseSubSupText()

```typescript
export const SIGN_SUB = '_'
export const SIGN_SUP = '^'
export interface OrgSubSupNode extends OrgNode {
  type: OrgNodeTypes.SUBSUP;
  sign: '_' | '^';
  target: string;
  sub?: string;
  sup?: string;
}

```

### parseEmphasisText()

```typescript
export function parseEmphasisText(parent: TextNode): TextNode
```

parse the built-in emphasis or [extra special](https://emacsnotes.wordpress.com/2022/06/29/use-org-extra-emphasis-when-you-need-more-emphasis-markers-in-emacs-org-mode/) texts.

Built-in: `~~, $$, ==, **`

Extra: `!!, !@, !%, !&, @!, @@, @%, @&, %!, %@, %%, %&, &!, &@, &%, &&`

### parseTimestamp()

```typescript
export function parseTimestamp(node: TextNode): TextNode
```

parse the timestamp text in header or anywhere.

eg.

`<2022-12-02 Wed 12:00 +1w>` will be parsed to a `Timestamp` type object:

```typescript
interface Timestamp {
  year: string;
  month: string;
  day: string;
  week?: string;
  time?: string;
  dein?: string; // [+-]\d[wdmy], per month/day/week/year date
}
```

`dein` is **decrease** or **increase** abbrev.

This also supports time scope, like `<2022-12-02 Wed 12:00-14:00 +1w>`

### parseExternalLink()

### parseInnerLink()

### parseStateKeywords()

### parseTags()

```typescript
function parseTags(content: string): {
  content: string;
  tags: string[];
} 
```

parse the tags behind the header. Format: `:tag1:tag2:tag3:` will be parsed to an string array `['tag1', 'tag2', 'tag3']`

## parseTextExtra()

## Utilities

### matchTimestamp()

```typescript
export function matchTimestamp(timestamp: string): Timestamp
```

## extractHeaderProperties()

## findIndex()

# Other

```json
// package.json
{
	"module": "dist/org-file-parser-with-js.esm.js",
}
```

