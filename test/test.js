const fs = require('fs');
const { baseParse, parseEmphasisNode: parse2 } = require('../dist/');

const ast = parse2(`TODO <<inner link>> DONE _u1 <red:underline /it<red:a>lic/ c2> u2_ text1 <2022-12-22 12:00> text2 [[desc:abbrev][link]]`)
fs.writeFile('/tmp/test.json', JSON.stringify(ast, null, 2), err => {
  if (err) console.log(err)
})
