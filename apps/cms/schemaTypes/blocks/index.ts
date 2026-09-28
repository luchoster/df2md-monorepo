import { defineField } from 'sanity'
import contactMap from './contact/contact-map'
import reviewsEmbed from './contact/reviews-embed'
import zipCheck from './contact/zip-check'
import faqList from './content/faq-list'
import imageText from './content/image-text'
import richContentBlock from './content/rich-content-block'
import ctaBanner from './hero/cta-banner'
import heroSlider from './hero/hero-slider'
import brandStrip from './shop/brand-strip'
import categoryGrid from './shop/category-grid'
import productGrid from './shop/product-grid'

export const blocks = [
  heroSlider,
  ctaBanner,
  richContentBlock,
  imageText,
  faqList,
  productGrid,
  categoryGrid,
  brandStrip,
  contactMap,
  zipCheck,
  reviewsEmbed
]

const groups = [
  { name: 'hero', title: 'Hero', of: ['hero-slider', 'cta-banner'] },
  { name: 'content', title: 'Content', of: ['rich-content-block', 'image-text', 'faq-list'] },
  { name: 'shop', title: 'Shop', of: ['product-grid', 'category-grid', 'brand-strip'] },
  { name: 'contact', title: 'Contact', of: ['contact-map', 'zip-check', 'reviews-embed'] }
]

/** The page-builder field shared by `page` and `homePage` (plan §2.5b). */
export const blocksField = defineField({
  name: 'blocks',
  title: 'Blocks',
  type: 'array',
  group: 'content',
  of: blocks.map((block) => ({ type: block.name })),
  validation: (rule) => rule.min(1),
  options: {
    insertMenu: {
      groups,
      views: [
        { name: 'grid', previewImageUrl: (type) => `/static/images/preview/${type}.jpg` },
        { name: 'list' }
      ]
    }
  }
})
