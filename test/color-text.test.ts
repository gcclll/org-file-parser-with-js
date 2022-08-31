import { OrgNodeTypes, baseParse } from '../src/index';

function parse(s: string) {
  const ast = baseParse(s);
  return ast.children[0].children;
}

function matchChildren(
  s: string,
  index: number,
  refObj: any,
  matchAll = false
): void {
  const children = parse(s) || [];

  // console.log(JSON.stringify(children, null, 2), index)
  if (matchAll) {
    expect(children).toMatchObject(refObj);
  } else {
    expect(children[index]).toMatchObject(refObj);
  }
}

describe('colorful text', () => {
  it('with angle bracket, eg. <red:text>', () => {
    matchChildren(`<red:text>`, 0, {
      type: OrgNodeTypes.COLORFUL_TEXT,
      color: 'red',
      children: [
        {
          type: OrgNodeTypes.TEXT,
          content: 'text',
        },
      ],
    });

    matchChildren(`in <red:text> other text`, 1, {
      type: OrgNodeTypes.COLORFUL_TEXT,
      color: 'red',
      children: [
        {
          type: OrgNodeTypes.TEXT,
          content: 'text'
        }
      ]
    })
  });

  it('without angle bracket, eg. red:text', () => {
    matchChildren(`red:text`, 0, {
      type: OrgNodeTypes.COLORFUL_TEXT,
      color: 'red',
      content: 'text',
    });

    matchChildren(`in red:text other text`, 1, {
      type: OrgNodeTypes.COLORFUL_TEXT,
      color: 'red',
      content: 'text',
    });
  });
});
