import { contactMapFragment, reviewsEmbedFragment } from './contact'
import {
  aboutIntroFragment,
  faqListFragment,
  faqSearchFragment,
  featureGridFragment,
  featurePhotoFragment,
  featureRowsFragment,
  featureSplitFragment,
  imageTextFragment,
  richContentFragment,
  stepsFragment
} from './content'
import { ctaBannerFragment, heroSliderFragment } from './hero'
import { brandStripFragment, categoryGridFragment, productGridFragment } from './shop'

/** One projection for every page-builder block; used by page, homePage and product blocks. */
export const blocksFragment = /* groq */ `
  ${heroSliderFragment},
  ${ctaBannerFragment},
  ${richContentFragment},
  ${imageTextFragment},
  ${faqListFragment},
  ${faqSearchFragment},
  ${featureGridFragment},
  ${featureSplitFragment},
  ${featureRowsFragment},
  ${featurePhotoFragment},
  ${aboutIntroFragment},
  ${stepsFragment},
  ${productGridFragment},
  ${categoryGridFragment},
  ${brandStripFragment},
  ${contactMapFragment},
  ${reviewsEmbedFragment}
`
