import { StarIcon } from '@sanity/icons/Star'
import { defineField, defineType } from 'sanity'
import { imageField } from '../objects/image'
import { legacyGroup } from '../objects/legacy'

export default defineType({
  name: 'brand',
  title: 'Brand',
  type: 'document',
  icon: StarIcon,
  groups: [{ name: 'main', title: 'Brand', default: true }, legacyGroup],
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
    imageField({ name: 'logo', group: 'main' }),
    defineField({ name: 'featured', type: 'boolean', group: 'main', initialValue: false }),
    defineField({
      name: 'legacy',
      type: 'object',
      group: 'legacy',
      readOnly: true,
      fields: [
        defineField({ name: 'acfValue', title: 'ACF choice value', type: 'string' }),
        defineField({ name: 'importedAt', type: 'datetime' })
      ]
    })
  ],
  orderings: [{ title: 'Name', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] }],
  preview: { select: { title: 'title', media: 'logo' } }
})
