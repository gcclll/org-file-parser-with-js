LIVE DEMO: https://cheng92.com/demo/org

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

    * [x] CLOSED|DEADLINE -> OrgTimestamp

    * [x] CLOCK -> OrgClockValue -> `{ start, end?, duration? }`

      ```json
      :LOGBOOK:
      CLOCK: [2022-08-05 Fri 17:38]--[2022-08-05 Fri 17:39] =>  0:01
      :END:
      
      // => result
      
      {
      	name: 'CLOCK',
        value: { 
          start: { year: '2022', month: '08', day: '05', week: 'Fri', time: '17:38' }
          end: { year: '2022', month: '08', day: '05', week: 'Fri', time: '17:38' }, 
          duration: '0:01'
        },
        category: 'LOGBOOK'
      }
      ```

      

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
    
    Without `<>`, only support simple syntax，if want to use complex colorful text, use  `<...>` instead.
    
    * [x] Support emphasis text, `<red:text1 _text2_>
    
  * [x] Nested emphasis node

    `_underline before <red:colorfultext> after_`

    Support: `_u1 <red:underline /italic/ c2> u2_`

    Not support: `_u1 <red:underline /it<red:a>lic/ c2> u2_`

  * [ ] Special text, `doc:documentation`

  * [x] Self-define Emphasis, `~~, ==, ++, __, //, $$`

    * [x] [extra]( https://emacsnotes.wordpress.com/2022/06/29/use-org-extra-emphasis-when-you-need-more-emphasis-markers-in-emacs-org-mode/) : `!!, !@, !%, !&, @!, @@, @%, @&, %!, %@, %%, %&, &!, &@, &%, &&`

  * [x] Badge text `<badge:left|/|right>`

    Full badge format: `<badge:label | labelColor | message | color | / | logo | logoColor | / | messageLink | labelLink>`

* [x] Attribute, `#+title: org-file-parser-with-js`

* [x] Timestamps

  * [x] Inactive timestamp: `[yyyy-MM-dd Week hh:mm]`

  * [x] Active timestamp: `<yyyy-MM-dd Week hh:mm>`

* [x] [Images](https://orgmode.org/manual/Images.html)

* [x] Subscripts and Superscripts

  * [x] more richable text, eg. Emphasis, Colorful text

* [x] List

  * [x] Unordered lists, `-, +, * `
  * [x] Ordered lists, `1. 1)`
  * [x] List children parsing

* [x] Blocks, `#+begin_xxx ... #end_xxx`

  * [x] Textblock, special text block

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

* [x] Table

  * [x] Base table

    ```org
    | name | value |
    |------+-------|
    | xxx  | yyy   |
    ```
    
    result:
    
    ```json
    {
        "type": 12, // OrgNodeTypes.TABLE
        "nodes": [ // table rows
            {
                "0": "xx",
                "1": "yy"
            },
            {
                "0": "al",
                "1": "bb"
            }
        ],
        "columns": [ // table column properties
            {
                "label": "name",
                "prop": "0"
            },
            {
                "label": "value",
                "prop": "1"
            }
        ],
        "rows": 4,
        "indent": 0
    }
    ```
    
    


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
```

Result Example JSON:

```json
{
    "type": 0,
    "children": [
        {
            "type": 2,
            "name": "title",
            "value": "test"
        },
        {
            "type": 2,
            "name": "author",
            "value": "gcclll"
        },
        {
            "type": 2,
            "name": "email",
            "value": "gccll.love@gmail.com"
        },
        {
            "type": 1,
            "content": "I'am test test!!!!",
            "indent": 0,
            "children": [
                {
                    "type": 1,
                    "content": "I'am test test!!!!",
                    "indent": 0,
                    "children": []
                }
            ]
        },
        {
            "type": 3,
            "title": {
                "type": 1,
                "content": "header1-1",
                "indent": 0,
                "children": [
                    {
                        "type": 1,
                        "content": "header1-1",
                        "indent": 0,
                        "children": []
                    }
                ]
            },
            "indent": 0,
            "level": 1,
            "properties": [],
            "tags": [
                "test",
                "bbb",
                "ccc"
            ]
        },
        {
            "type": 1,
            "content": "header1 content",
            "indent": 0,
            "children": [
                {
                    "type": 1,
                    "content": "header1 content",
                    "indent": 0,
                    "children": []
                }
            ]
        },
        {
            "type": 3,
            "title": {
                "type": 1,
                "content": "header2-1",
                "indent": 0,
                "children": [
                    {
                        "type": 1,
                        "content": "header2-1",
                        "indent": 0,
                        "children": []
                    }
                ]
            },
            "indent": 0,
            "level": 2,
            "properties": [],
            "tags": []
        },
        {
            "type": 1,
            "content": "Header2-1 content 1",
            "indent": 0,
            "children": [
                {
                    "type": 1,
                    "content": "Header2-1 content 1",
                    "indent": 0,
                    "children": []
                }
            ]
        },
        {
            "type": 2,
            "name": "test",
            "value": "header2 attribute"
        },
        {
            "type": 1,
            "content": "Header2-1 content 2",
            "indent": 0,
            "children": [
                {
                    "type": 1,
                    "content": "Header2-1 content 2",
                    "indent": 0,
                    "children": []
                }
            ]
        },
        {
            "type": 1,
            "content": "Header2-1 content 3",
            "indent": 0,
            "children": [
                {
                    "type": 1,
                    "content": "Header2-1 content 3",
                    "indent": 0,
                    "children": []
                }
            ]
        },
        {
            "type": 3,
            "title": {
                "type": 1,
                "content": "emphasis node",
                "indent": 0,
                "children": [
                    {
                        "type": 1,
                        "content": "emphasis node",
                        "indent": 0,
                        "children": []
                    }
                ]
            },
            "indent": 0,
            "level": 1,
            "properties": [],
            "tags": []
        }
    ],
    "properties": [],
    "footnotes": [],
    "options": {}
}
```

# Problems



- ``: { type: 'div', props: { id: 'foo', children: [ [Object] ] } }`` will be parsed to 

```json
{
    "type": 0,
    "children": [
        {
            "type": 1,
            "content": ":{ type: 'div', props: { id: 'foo', children: [ [Object] ] } }",
            "indent": 0,
            "children": [
                {
                    "type": 1,
                    "content": ":{ type: 'div', props: { id: 'foo', children: "
                },
                {
                    "type": 1,
                    "content": "[",
                    "children": []
                },
                {
                    "type": 5, // should be 1 /*TEXT*/ and content -> `Object`
                    "sign": "[",
                    "children": [
                        {
                            "type": 1,
                            "content": "Object] ] } }   "
                        }
                    ],
                    "extra": false
                }
            ]
        }
    ],
    "properties": [],
    "footnotes": []
}
```

