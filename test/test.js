const fs = require('fs');
const { baseParse: parse, parseEmphasisNode: parse2, traverse } = require('../dist/');

let text = `TODO <<inner link>> DONE _u1 <red:underline /italic/ c2> u2_ text1 red:bare-text text5 <2022-12-22 12:00> text2 [[desc:abbrev][link]] text3  title-xxx^{sup-text} title-yyy_{sub-text}`
text = `i should red:text1  green:text between texts <gray:xxx yyy> .`
text = `red:text`
// text = `<red:text>`
// text = `title^{_sub_}`
text = `in red:text other text`
text = `text1 !!text2!! text3`
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
`
text = `
:PROPERTIES:
:ID:       a4647863-71e6-4764-88db-b80bfb963f69
:END:

  text 1
#+list_attr: name=x-list;value=xxx
1) list item 1
   text 11
2) list item 2

    text 22

    text 33

1) list item 3
2) list item 3
* header`

text = `:PROPERTIES:
:ID:       293eb7ed-0b86-4a5c-acc2-ea5b26e92326
:END:
#+SETUPFILE:~/.gclrc/org/hugo_setup.org
#+HUGO_SLUG: build_your_own_react
#+HTML_HEAD: <meta name="category" content="react"/>
#+HTML_HEAD: <meta name="createdAt" content="2022-03-06 09:40:27"/>
#+TITLE: Build your own react
<badge:GCCLL | Homepage | green | / | gnu-emacs | tinder>

#+begin_export html
<link href="https://fonts.goo~gleapis.com/cs~s2?family=ZCOOL+XiaoWei&display=swap" rel="stylesheet">
<kbd>
<font color="blue" size="3" style="font-family: 'ZCOOL XiaoWei', serif;">
  诗号：半神半圣亦半仙，全儒全道是全贤，脑中真书藏万卷，掌握文武半边天。
</font>
</kbd><br><br>
<script src="/js/react/didact.js"></script>
<img  src="/img/bdx/shz-001.jpg"/>
#+end_export

#+begin_quote
该文代码均来自：[[https://pomb.us/build-your-own-react/][Build your own React]]， 所以文中代码会保持和原作者定义一致。
#+end_quote

* 代码脑图
:PROPERTIES:
:COLUMNS: %CUSTOM_ID[(Custom Id)]
:CUSTOM_ID: map
:END:

#+begin_src js
const element = <h1 title="foo">Hello</h1>;
const container = document.getElementById("root");
ReactDOM.render(element, container);
#+end_src

[[../assets/img/react/react-zero.svg]]

实现主要分为几个步骤

1. createElement 函数实现
2. render 函数实现
3. 并发模式，渲染任务的执行 ~workLoop()~ 函数
4. Fibers react 中通过 fiber 结构来链接 parent, first child, sibling 以及作为节
   点的结构，类似 vue 的 VNode
5. 渲染和 commit 阶段，为了解决渲染进程可能被浏览器中断的问题，采取的是延迟渲染，
   即在所有的 fiber 处理完之后，在最后执行渲染操作。
6. 更新，新增，删除操作
7. 函数式组件实现
8. 钩子函数的实现 ~useState~

* 预览
:PROPERTIES:
:COLUMNS: %CUSTOM_ID[(Custom Id)]
:CUSTOM_ID: preview
:END:

react 使用实例：
#+begin_src js
const element = <h1 title="foo">Hello</h1>;
const container = document.getElementById('root');
ReactDOM.render(element, container)
#+end_src

首先 ~const element = <h1 title="foo">Hello</h1>;~ 属于 JSX 书写风格，这个会被转
换成 JS 代码:

#+begin_src js
// 参数：
// 1. type: 'h1' 标签名
// 2. props: {title: 'foo'} 为元素的属性对象
// 3. children: 'Hello' 为子元素
const element = React.createElement("h1", { title: "foo" }, "Hello");
#+end_src

其次是 ~ReactDOM.render(element, container)~ 进行渲染到真实DOM的操作，这个函数的
功能简述：

#+begin_src js
// 1. 根据 element.type 去创建 off-dom 元素
const node = document.createElement(element.type);
// 2. 设置属性 props
node['title'] = element.props.title

// 3. 处理 children 子元素
const text = document.createTextNode('')
text['nodeValue'] = element.props.children

// 4. 最后更新到真实DOM树
node.appendChild(text)
container.appendChild(node)
#+end_src

所以 render 函数的功能总结下来就分为四个步骤：

1. 拿到节点的 fiber 结构，创建 off-dom 元素
2. 处理 element.props 属性(可能是动态，静态，也可能是事件属性)
3. 处理 element.children 子元素
4. 更新到真实的 DOM 树


具体的实现都是围绕这个点去完成的，

比如 *1* 会使用 fiber 结构来组织每个节点，并且每个节点结构一般会有三个引用：
parent、first child、sibling 这三个链接这个整个fiber 树的，这也为了后面节点操作
时方便查找。

又比如 *2* 中对 props 的处理，会考虑是不是事件属性 onXxx 。

以及最后更新真实DOM的时机等待。

#+begin_quote
nodeValue: [[https://www.w3schools.com/jsref/prop_node_nodevalue.asp][HTML DOM nodeValue Property]]

[[../assets/img/tmp/dom-prop-nodeValue.png]]
#+end_quote

完整代码：
#+begin_src js
// createElement: jsx -> js vnode 结构
const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello'
  }
}

const container = document.getElementById('root')

// 创建节点
const node = document.createElement(element.type)
node['title'] = element.props.title

// 创建子节点
const text = document.createTextNode('')
text['nodeValue'] = element.props.children

node.appendChild(text)
container.appendChild(node)
#+end_src

#+begin_export html
<font color="blue">测试：</font>
<div id="c07Rp8"></div>
<script>
// createElement: jsx -> js vnode 结构
const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello'
  }
}

const container = document.getElementById('c07Rp8')

// 创建节点
const node = document.createElement(element.type)
node['title'] = element.props.title

// 创建子节点
const text = document.createTextNode('')
text['nodeValue'] = element.props.children

node.appendChild(text)
container.appendChild(node)
</script>
#+end_export

[[../assets/img/react/react-render-brief.svg]]

* createElement
:PROPERTIES:
:COLUMNS: %CUSTOM_ID[(Custom Id)]
:CUSTOM_ID: create-element
:END:

JSX 实例:
#+begin_src js
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
#+end_src

转成 JS 后调用 createElement:
#+begin_src js
React.createElement(
  "div",
  {
    id: "foo",
  },
  React.createElement("a", null, "bar"),
  React.createElement("b")
);
#+end_src

一个节点在渲染到 DOM 之前都会是以一个VNode 形式存在，其中就包含最基本的 type,
props 属性。


~{type: 'div', props: { id: 'foo', children: ... } }~

这和 vue vnode 结构是类似的，只不过 vue vnode 的 children 不是在 props 里面：

~{type: 'div', props: {id: 'foo'}, children: [...] }~

这里只要知道 createElement 目的是解析节点，返回一个节点结构对象，下面就可以开始尝
试实现 createElement 了


最简单的实现：
#+begin_src js
// 第三个参数开始都当做子元素
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children,
    },
  };
}

// 所以，上面的实例会有如下结构：
var div = {
  type: "div",
  props: { id: "foo", children: [a, b] },
};

var a = {
  type: "a",
  props: {
    children: ["bar"],
  },
};

var b = {
  type: "b",
  props: {
    children: [], // 没有的时候默认返回空数组
  },
};
#+end_src


这里面对于 children 有两种类型

1. ~<a>bar</a>~ 的 children 只有 "bar" 是个纯文本类型
2. ~<div>...</div>~ 的 children 有两个节点 a 和 b ，他们经过 createElement 之后
   都是对象，所以这里需要进行判断下，纯文本去创建文本节点


#+begin_src js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      // 这里对于文本内容，去创建文本节点
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT", // 标记类型
    props: {
      // node.nodeValue 属性可以设置文本节点的内容，类似 textContent
      nodeValue: text,
      children: [],
    },
  };
}

// 测试
const element = createElement(
  "div",
  { id: "foo" },
  createElement("a", null, "bar"),
  createElement("b")
);
console.log(
  "输出结构>>> \n",
  element,
  "\n > element children: \n",
  element.props.children,
  "\n > a children: \n",
  element.props.children[0].props.children
);

// 为了区别 React，这里采用文字作者的命名空间： Didact
const Didact = {
  createElement
}
#+end_src


#+RESULTS:
#+begin_example
输出结构>>>
 { type: 'div', props: { id: 'foo', children: [ [Object], [Object] ] } }
 > element children:
 [
  { type: 'a', props: { children: [Array] } },
  { type: 'b', props: { children: [] } }
]
 > a children:
 [ { type: 'TEXT_ELEMENT', props: { nodeValue: 'bar', children: [] } } ]
undefined
#+end_example


为了方便后面的测试，考虑到代码会慢慢变长问题，后面的代码会移到
[[/js/react/didact.js]] 中去。

之后测试方式：
#+begin_src js
import(process.env.BLOG_JS + "/react/didact.js").then(({ default: Didact }) => {
  console.log(Didact);
  // 这样照样可以完成上面的测试
  const element = Didact.createElement(
    "div",
    { id: "foo" },
    Didact.createElement("a", null, "bar"),
    Didact.createElement("b")
  );
  console.log(element);
});
#+end_src


#+RESULTS:
: undefined
: { createElement: [Function: createElement] }
: { type: 'div', props: { id: 'foo', children: [ [Object], [Object] ] } }


`
text = `: { type: 'div', props: { id: 'foo', children: [ [Object] ] } }`

const ast = parse(text)
// traverse(ast, (node) => {
//   console.log(node)
// })
fs.writeFile('./test.json', JSON.stringify(ast, null, 2), err => {
  if (err) console.log(err)
})
