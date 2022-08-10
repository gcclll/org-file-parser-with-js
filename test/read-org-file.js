const fs = require('fs');
const { baseParse, parseNestedEmphasisNode: parse2 } = require('../dist/');

const log = console.log;
const ast = parse2(`_text1 <red:emphasis1-emphasis2> text2_`)
console.log(ast.children[0], 20000)
fs.readFile('./demo.org', (err, data) => {
  if (err) {
    console.warn(err);
    return;
  }
  if (data) {
    const context = data.toString();
    const nodes = baseParse(context);

    fs.writeFile(
      './org.js',
      `window.$json=${JSON.stringify(nodes)}`,
      (err) => {
        console.log('write error', err);
      }
    );
  }
});
