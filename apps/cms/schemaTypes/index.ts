import { blocks } from './blocks'
import brand from './documents/brand'
import category from './documents/category'
import homePage from './documents/home-page'
import page from './documents/page'
import product from './documents/product'
import siteSettings from './documents/site-settings'
import blockContent from './objects/block-content'
import link from './objects/link'
import meta from './objects/meta'
import sectionPadding from './objects/section-padding'
import simpleContent from './objects/simple-content'
import table from './objects/table'
import variant from './objects/variant'

export const singletons = [homePage, siteSettings]
export const documents = [product, category, brand, page]
export const objects = [link, meta, sectionPadding, blockContent, simpleContent, table, variant]

export const schemaTypes = [...singletons, ...documents, ...objects, ...blocks]
