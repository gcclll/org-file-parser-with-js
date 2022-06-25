const fs = require('fs');
const { baseParse } = require('../dist/');

const log = console.log;
fs.readFile('./demo.org', (err, data) => {
  if (err) {
    console.warn(err);
    return;
  }
  if (data) {
    const context = data.toString();
    console.log(context.split(/\\n+/g))
    const ast = baseParse(context);
    const last = ast.children[ast.children.length - 1];

    fs.writeFile(
      process.env.HOME + '/tmp/org.js',
      `window.$json=${JSON.stringify(ast)}`,
      (err) => {
        console.log('write error', err);
      }
    );
  }
});
