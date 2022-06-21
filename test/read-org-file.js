const fs = require('fs')
const { baseParse } = require('../dist/')

fs.readFile('./demo.org', (err, data) => {
  const context = data.toString()
  const ast = baseParse(context)
  console.log(context, ast, ast.children[0])
})
