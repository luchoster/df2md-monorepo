import { ThLargeIcon } from '@sanity/icons/ThLarge'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { FEATURE_ICONS } from '../../../lib/icons'
import { backgroundField, paddingField } from '../shared'

/** shadcnblocks Feature 17: centered intro + up to six icon features in two columns. */
export default defineType({
  name: 'feature-grid',
  title: 'Feature grid',
  type: 'object',
  icon: ThLargeIcon,
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      description: 'Small badge above the heading, e.g. "Why us"'
    }),
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'features',
      type: 'array',
      validation: (rule) => rule.min(2).max(6),
      of: [
        defineArrayMember({
          name: 'feature',
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              type: 'string',
              options: { list: FEATURE_ICONS },
              initialValue: 'paw-print'
            }),
            defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'description', type: 'text', rows: 3 })
          ],
          preview: { select: { title: 'title', subtitle: 'description' } }
        })
      ]
    }),
    defineField({ name: 'button', type: 'link' }),
    backgroundField(),
    paddingField
  ],
  preview: {
    select: { title: 'heading', features: 'features' },
    prepare: ({ title, features }) => ({
      title,
      subtitle: `Feature grid · ${features?.length ?? 0} features`
    })
  }
})
