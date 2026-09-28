import { HomeIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { blocksField } from '../blocks'

/** Singleton, `_id: 'homePage'`. */
export default defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' }
  ],
  fields: [blocksField, defineField({ name: 'meta', type: 'meta', group: 'seo' })],
  preview: { prepare: () => ({ title: 'Home page' }) }
})
