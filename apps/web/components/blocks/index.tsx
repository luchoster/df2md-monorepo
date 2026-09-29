import type { ComponentType } from 'react'
import ContactMap from './contact/contact-map'
import ReviewsEmbed from './contact/reviews-embed'
import AboutIntro from './content/about-intro'
import FaqList from './content/faq-list'
import FaqSearch from './content/faq-search'
import FeatureGrid from './content/feature-grid'
import FeaturePhoto from './content/feature-photo'
import FeatureRows from './content/feature-rows'
import FeatureSplit from './content/feature-split'
import ImageText from './content/image-text'
import RichContentBlock from './content/rich-content-block'
import Steps from './content/steps'
import CtaBanner from './hero/cta-banner'
import HeroSlider from './hero/hero-slider'
import BrandStrip from './shop/brand-strip'
import CategoryGrid from './shop/category-grid'
import ProductGrid from './shop/product-grid'
import type { Block } from './types'

// Each component receives its own block type; the map is keyed by _type.
const componentMap: Record<Block['_type'], ComponentType<any>> = {
  'hero-slider': HeroSlider,
  'cta-banner': CtaBanner,
  'rich-content-block': RichContentBlock,
  'image-text': ImageText,
  'faq-list': FaqList,
  'faq-search': FaqSearch,
  'feature-rows': FeatureRows,
  'feature-photo': FeaturePhoto,
  'about-intro': AboutIntro,
  'feature-grid': FeatureGrid,
  'feature-split': FeatureSplit,
  steps: Steps,
  'product-grid': ProductGrid,
  'category-grid': CategoryGrid,
  'brand-strip': BrandStrip,
  'contact-map': ContactMap,
  'reviews-embed': ReviewsEmbed
}

/** Renders a page-builder array. Heading levels come from position: the first block owns the h1. */
export default function Blocks({ blocks }: { blocks: Block[] | null | undefined }) {
  return (
    <>
      {blocks?.map((block, index) => {
        const Component = componentMap[block._type]
        if (!Component) {
          console.warn(`No component for block type "${block._type}"`)
          return <div key={block._key} data-type={block._type} />
        }
        return <Component key={block._key} {...block} isFirst={index === 0} />
      })}
    </>
  )
}
