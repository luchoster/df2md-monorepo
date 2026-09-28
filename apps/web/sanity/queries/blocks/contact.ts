export const contactMapFragment = /* groq */ `
  _type == "contact-map" => {
    _type, _key, heading, text, phone, email, address, hours, mapEmbedUrl,
    showForm, formHeading, padding
  }
`

export const reviewsEmbedFragment = /* groq */ `
  _type == "reviews-embed" => {
    _type, _key, heading, provider, embedUrl, padding, reviews[]{ _key, author, rating, text }
  }
`
