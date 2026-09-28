export const contactMapFragment = /* groq */ `
  _type == "contact-map" => {
    _type, _key, heading, text, phone, email, address, hours, mapEmbedUrl,
    showForm, formHeading, padding
  }
`

/** recipientEmail stays server-side: the form posts the block key, the API route looks it up. */
export const zipCheckFragment = /* groq */ `
  _type == "zip-check" => {
    _type, _key, heading, text, submitLabel, inAreaMessage, outsideAreaMessage, background, padding
  }
`

export const reviewsEmbedFragment = /* groq */ `
  _type == "reviews-embed" => {
    _type, _key, heading, provider, embedUrl, padding, reviews[]{ _key, author, rating, text }
  }
`
