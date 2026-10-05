import { OlistIcon } from '@sanity/icons/Olist'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { backgroundField, paddingField } from '../shared'

/** shadcnblocks Feature 187: heading + numbered steps joined by a connector line. */
export default defineType({
  name: 'steps',
  title: 'Steps',
  type: 'object',
  icon: OlistIcon,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 2 }),
    defineField({
      name: 'steps',
      type: 'array',
      validation: (rule) => rule.required().min(2).max(4),
      of: [
        defineArrayMember({
          name: 'step',
          type: 'object',
          fields: [
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
    select: { title: 'heading', steps: 'steps' },
    prepare: ({ title, steps }) => ({ title, subtitle: `Steps · ${steps?.length ?? 0}` })
  }
})
