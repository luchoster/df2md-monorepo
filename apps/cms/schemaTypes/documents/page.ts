import { DocumentIcon } from '@sanity/icons/Document'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { blocksField } from '../blocks'
import { legacyField, legacyGroup } from '../objects/legacy'

const RESERVED_SLUGS = ['shop', 'subscriptions', 'account', 'checkout', 'cart', 'api', 'studio']

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'settings', title: 'Settings' },
    { name: 'seo', title: 'SEO' },
    legacyGroup
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required()
    }),
    blocksField,
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'settings',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) =>
        rule
          .required()
          .custom((slug) =>
            slug?.current && RESERVED_SLUGS.includes(slug.current)
              ? `"${slug.current}" is used by the shop and can't be a page URL`
              : true
          )
    }),
    defineField({
      name: 'oldUrls',
      title: 'Old URLs',
      description: 'Legacy paths (e.g. /about-us/) that should redirect here',
      type: 'array',
      group: 'settings',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' }
    }),
    defineField({ name: 'meta', type: 'meta', group: 'seo' }),
    legacyField(),
    orderRankField({ type: 'page' })
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({ title, subtitle: slug ? `/${slug}` : 'no slug' })
  }
})
