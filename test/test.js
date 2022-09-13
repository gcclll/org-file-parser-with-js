const fs = require('fs');
const {
  baseParse: parse,
  parseEmphasisNode: parse2,
  traverse,
  handleBadgeInterpo,
  interpolations,
} = require('../dist/');

let text = `TODO <<inner link>> DONE _u1 <red:underline /italic/ c2> u2_ text1 red:bare-text text5 <2022-12-22 12:00> text2 [[desc:abbrev][link]] text3  title-xxx^{sup-text} title-yyy_{sub-text}`;
text = `i should red:text1  green:text between texts <gray:xxx yyy> .`;
text = `red:text`;
// text = `<red:text>`
// text = `title^{_sub_}`
text = `in red:text other text`;
text = `text1 !!text2!! text3`;
// text = `in <red:text> other text`
text = `#+title: test
#+author: gcclll
#+email: gccll.love@gmail.com

* Table

| name    | value |
|---------+-------|
| default | since |
| 222     | 1111  |

* Blocks

Javascript:

#+begin_src javascript
function test() {
   console.log('hello world!')
}
#+end_src

Emacs Lisp:

#+begin_src emacs-lisp
(message "hello world!")
#+end_src

* Colorful text

<red:text1 text2>

#ccc:i #666666:should red:text1 green:text cyan:between yellow:texts.

** Awesome font family

You can self-define any style text.

!!xxxx!! !@xxx!@ !%xxx!% !&x!&

@!xxx@! @@xxx@@ @%xxx@% @&xxx@&

%!xxx%! %@xxx%@ %%xxx%% %&xxx%&

&!xxx&! &@xxx&@ &%xxx&% &&xxx&&

** Emphasis text

bold: *bold text*

italic: /italic text/

delete: +line through+

underline: _underline_
* Text Node
I'am test test!!!!

<2022-02-12 18:00 Wed +1d> test <2033-03-13 22:00> test !!xxx!!

I'm an image link [[a.png]], you can display it in org file.


* Links
inner link: <<test>> ???

link with abbrev: [[d.png:d-img][description]] ???
* keywords
keywords: TODO, DONE, CANCELLED, ???

* List

Orderless List:

- orderless list item 1
- orderless list item 2

Order List:

1. order list item 1
2. order list item 2


* textbox

#+begin_textbox
test box

!!test!! !@test!@ !%test!% !&test!&

@!test@! @@test@@ @%test@% @&test@&

%!test%! %@test%@ %%test%% %&test%&

&!test&! &@test&@ &%test&% &&test&&


#+end_textbox

* sub & sup scripts

suptext^sup xxxx text subtext_sub jjjjkkkj

* TODO header1^{sup}  xx_{sub} :tag1:tag2:emacs:vue:react:
DEADLINE: <2022-07-06 Wed>
:PROPERTIES:
:STYLE: .test{color:red}
:END:
`;
text = `
:PROPERTIES:
:ID:       a4647863-71e6-4764-88db-b80bfb963f69
:END:

<badge:GCCLL | Homepage | green | / | gnu-emacs | tinder |/| https://www.baidu.com | https://blog.cheng92.com>
  text 1

text1 red:text text2 <color:text> text3

https://www.baidu.com

#+list_attr: name=x-list;value=xxx
1) list item 1
   text 11
2) list item 2

    text 22

    text 33

1) list item 3
2) list item 3
* header
:PROPERTIES:
:TEST: multiple property test
:END:
#+NAME: header single property

#+begin_src emacs-lisp
(message "hello emacs-lisp!!!")
#+end_src

#+RESULT:
: "hello world!"
: "hello emacs-lisp!"
`;

const ast = parse(text);
// traverse(ast, (node) => {
//   console.log(node)
// })
fs.writeFile('./test.json', JSON.stringify(ast, null, 2), (err) => {
  if (err) console.log(err);
});

const list = [
  `<badge:GCCLL | Homepage | green | / | gnu-emacs | tinder |/| https://www.baidu.com | https://blog.cheng92.com> xxx <badge:gcclll|home|blue>`
]

handleBadgeInterpo(list)

// console.log(interpolations, list)
