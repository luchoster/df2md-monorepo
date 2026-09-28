import { SearchIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'meta',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description: 'Falls back to the document title',
      validation: (rule) => rule.max(70).warning('Titles over 70 characters get truncated')
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(160).warning('Descriptions over 160 characters get truncated')
    }),
    defineField({ name: 'image', type: 'image', description: 'Social share image (1200×630)' }),
    defineField({
      name: 'noindex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false
    })
  ]
})
