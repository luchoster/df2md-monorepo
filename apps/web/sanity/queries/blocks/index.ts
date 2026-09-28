import { contactMapFragment, reviewsEmbedFragment } from './contact'
import { faqListFragment, imageTextFragment, richContentFragment } from './content'
import { ctaBannerFragment, heroSliderFragment } from './hero'
import { brandStripFragment, categoryGridFragment, productGridFragment } from './shop'

/** One projection for every page-builder block; used by page, homePage and product blocks. */
export const blocksFragment = /* groq */ `
  ${heroSliderFragment},
  ${ctaBannerFragment},
  ${richContentFragment},
  ${imageTextFragment},
  ${faqListFragment},
  ${productGridFragment},
  ${categoryGridFragment},
  ${brandStripFragment},
  ${contactMapFragment},
  ${reviewsEmbedFragment}
`
