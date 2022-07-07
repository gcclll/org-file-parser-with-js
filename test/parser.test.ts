
import { baseParse as parse } from '../dist/'

describe('parser', () => {
  it('header', () => {
    expect(parse(`* header 1`)).toMatchObject([{
      type: 3 /*NodeTypes.HEADER*/,
      content: {
        type: 1,
        children: [{
          type: 1,
          content: 'header 1'
        }]
      },
      title: `header 1`
    }])
  })
})
