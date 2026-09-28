/** Resolves internal references to a type + slug; lib/links.ts turns that into a path. */
export const linkFragment = /* groq */ `
  title,
  linkType,
  href,
  target,
  buttonVariant,
  "internal": internal->{ _type, "slug": slug.current }
`
