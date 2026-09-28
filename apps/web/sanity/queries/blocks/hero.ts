import { imageFragment } from '../shared/image'
import { linkFragment } from '../shared/link'

export const heroSliderFragment = /* groq */ `
  _type == "hero-slider" => {
    _type, _key, autoplay, intervalMs, padding,
    slides[]{ _key, image { ${imageFragment} }, title, text, buttonText, link { ${linkFragment} }, textPosition, textBackground }
  }
`

export const ctaBannerFragment = /* groq */ `
  _type == "cta-banner" => {
    _type, _key, text, background, padding,
    button { ${linkFragment} },
    image { ${imageFragment} }
  }
`
