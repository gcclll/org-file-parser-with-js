const fs = require('fs');
const { baseParse: parse, parseEmphasisNode: parse2, traverse } = require('../dist/');

let text = `TODO <<inner link>> DONE _u1 <red:underline /italic/ c2> u2_ text1 red:bare-text text5 <2022-12-22 12:00> text2 [[desc:abbrev][link]] text3  title-xxx^{sup-text} title-yyy_{sub-text}`
text = `i should red:text1  green:text between texts <gray:xxx yyy> .`
text = `red:text1`
text = `<red:text1>`
// text = `title^{_sub_}`
const ast = parse(text)
// traverse(ast, (node) => {
//   console.log(node)
// })
fs.writeFile('/tmp/test.json', JSON.stringify(ast, null, 2), err => {
  if (err) console.log(err)
})
