const fs = require('fs');
const { baseParse } = require('../dist/');

fs.readFile('./demo.org', (err, data) => {
  if (err) {
    console.warn(err)
    return
  }
  if (data) {
    const context = data.toString();
    const ast = baseParse(context);
    console.log(context, ast);
    ast.children.forEach(child => console.log(child))
  }
});
