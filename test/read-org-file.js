const fs = require('fs');
const { baseParse, parseEmphasisNode: parse2 } = require('../dist/');

const log = console.log;
const ast = parse2(`_text1 <red:emphasis1-emphasis2> text2_`)
fs.readFile('./demo.org', (err, data) => {
  if (err) {
    console.warn(err);
    return;
  }
  if (data) {
    const context = data.toString();
    const nodes = baseParse(context);

    fs.writeFile(
      './org.json',
      JSON.stringify({ ast, nodes }),
      (err) => {
        console.log('write error', err);
      }
    );
  }
});
