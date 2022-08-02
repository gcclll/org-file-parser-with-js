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
