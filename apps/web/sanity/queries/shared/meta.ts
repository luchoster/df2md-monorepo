import { imageFragment } from './image'

export const metaFragment = /* groq */ `
  title,
  description,
  noindex,
  image { ${imageFragment} }
`
