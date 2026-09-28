/** Everything SanityImage needs: CDN url, blur placeholder, dimensions, hotspot/crop, alt. */
export const imageFragment = /* groq */ `
  _type,
  asset->{ _id, url, metadata { lqip, dimensions { width, height, aspectRatio } } },
  alt,
  hotspot,
  crop
`
