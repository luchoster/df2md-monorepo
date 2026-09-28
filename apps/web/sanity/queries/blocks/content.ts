import { bodyFragment } from '../shared/body'
import { imageFragment } from '../shared/image'
import { linkFragment } from '../shared/link'

export const richContentFragment = /* groq */ `
  _type == "rich-content-block" => {
    _type, _key, title, backgroundColor, textAlign, showLink, padding,
    content[]{ ${bodyFragment} },
    link { ${linkFragment} }
  }
`

export const imageTextFragment = /* groq */ `
  _type == "image-text" => {
    _type, _key, title, content, imageSide, background, padding,
    image { ${imageFragment} },
    cta { ${linkFragment} }
  }
`

export const faqListFragment = /* groq */ `
  _type == "faq-list" => { _type, _key, heading, padding, items[]{ _key, question, answer } }
`
