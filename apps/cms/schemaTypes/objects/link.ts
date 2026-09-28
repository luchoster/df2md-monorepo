import { LinkIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { BUTTON_VARIANTS } from '../../lib/constants'

/** Same shape as gnar's `link`: either an internal reference or a free `href`. */
export default defineType({
  name: 'link',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'linkType',
      type: 'string',
      initialValue: 'internal',
      options: {
        list: [
          { title: 'Internal', value: 'internal' },
          { title: 'External / path', value: 'href' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      }
    }),
    defineField({
      name: 'internal',
      type: 'reference',
      to: [{ type: 'page' }, { type: 'product' }, { type: 'category' }, { type: 'brand' }],
      hidden: ({ parent }) => parent?.linkType === 'href'
    }),
    defineField({
      name: 'href',
      title: 'URL or path',
      description: 'e.g. /shop, https://…, mailto:…, tel:…',
      type: 'url',
      validation: (rule) =>
        rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
      hidden: ({ parent }) => parent?.linkType !== 'href'
    }),
    defineField({
      name: 'target',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'buttonVariant',
      type: 'string',
      options: { list: BUTTON_VARIANTS },
      initialValue: 'default'
    })
  ],
  preview: {
    select: { title: 'title', href: 'href', internal: 'internal.title' },
    prepare: ({ title, href, internal }) => ({ title, subtitle: internal ?? href })
  }
})
