import { FolderIcon } from '@sanity/icons/Folder'
import { defineField, defineType } from 'sanity'
import { imageField } from '../objects/image'
import { legacyGroup } from '../objects/legacy'

/** Two-level product category tree (matches the 43 WooCommerce `product_cat` terms). */
export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  icon: FolderIcon,
  groups: [{ name: 'main', title: 'Category', default: true }, legacyGroup],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'main',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'main',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'parent',
      type: 'reference',
      group: 'main',
      to: [{ type: 'category' }],
      description: 'Leave empty for a top-level category. Only two levels are supported.',
      options: {
        filter: ({ document }) => ({
          filter: '!defined(parent) && !(_id in [$id, $draftId])',
          params: {
            id: document._id.replace(/^drafts\./, ''),
            draftId: `drafts.${document._id.replace(/^drafts\./, '')}`
          }
        })
      },
      validation: (rule) =>
        rule.custom((value, ctx) =>
          value?._ref && ctx.document?._id.replace(/^drafts\./, '') === value._ref
            ? 'A category cannot be its own parent'
            : true
        )
    }),
    defineField({ name: 'order', type: 'number', group: 'main', initialValue: 0 }),
    imageField({ name: 'image', group: 'main', altRequired: false }),
    defineField({ name: 'description', type: 'text', rows: 3, group: 'main' }),
    defineField({
      name: 'showInNav',
      title: 'Show in shop sidebar',
      type: 'boolean',
      group: 'main',
      initialValue: true
    }),
    defineField({ name: 'seo', type: 'meta', group: 'main' }),
    defineField({
      name: 'legacy',
      type: 'object',
      group: 'legacy',
      readOnly: true,
      fields: [
        defineField({ name: 'termId', type: 'number' }),
        defineField({ name: 'wpSlug', type: 'string' }),
        defineField({ name: 'importedAt', type: 'datetime' })
      ]
    })
  ],
  orderings: [
    {
      title: 'Menu order',
      name: 'orderAsc',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'title', direction: 'asc' }
      ]
    }
  ],
  preview: {
    select: { title: 'title', parent: 'parent.title', media: 'image' },
    prepare: ({ title, parent, media }) => ({
      title,
      subtitle: parent ? `in ${parent}` : 'Top level',
      media
    })
  }
})
