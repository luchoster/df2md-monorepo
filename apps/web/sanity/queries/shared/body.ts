import { imageFragment } from './image'

/** block-content / simple-content: dereference images, leave tables and links as stored. */
export const bodyFragment = /* groq */ `
  ...,
  _type == "image" => { _key, ${imageFragment} }
`
