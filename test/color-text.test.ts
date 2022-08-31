import { OrgNodeTypes, baseParse } from '../src/index';

function parse(s: string) {
  const ast = baseParse(s);
  return ast.children;
}

describe('colorful text', () => {
  it('color text with angle bracket, eg. <red:text>', () => {
    expect(parse(`<red:text>`)[0]).toMatchObject({
      type: OrgNodeTypes.COLORFUL_TEXT,
      color: 'red',
      children: [
        {
          type: OrgNodeTypes.TEXT,
          content: 'text1',
        },
      ],
    });
  });

  // it('color:bare-text', () => {});
});
