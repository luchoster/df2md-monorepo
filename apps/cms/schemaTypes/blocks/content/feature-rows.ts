import { StackIcon } from '@sanity/icons/Stack'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField } from '../../objects/image'
import { backgroundField, paddingField } from '../shared'

/** shadcnblocks Feature 62: a centered heading, then image-and-text rows that alternate sides. */
export default defineType({
  name: 'feature-rows',
  title: 'Alternating feature rows',
  type: 'object',
  icon: StackIcon,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'subheading', type: 'text', rows: 2 }),
    defineField({
      name: 'rows',
      type: 'array',
      validation: (rule) => rule.min(1),
      of: [
        defineArrayMember({
          name: 'featureRow',
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'description', type: 'text', rows: 3 }),
            imageField({ name: 'image', required: true }),
            defineField({ name: 'link', type: 'link' })
          ],
          preview: { select: { title: 'title', subtitle: 'description', media: 'image' } }
        })
      ]
    }),
    defineField({
      name: 'firstImageSide',
      title: 'First image side',
      description: 'The rows after it alternate',
      type: 'string',
      initialValue: 'left',
      options: { list: ['left', 'right'], layout: 'radio', direction: 'horizontal' }
    }),
    backgroundField(),
    paddingField
  ],
  preview: {
    select: { heading: 'heading', rows: 'rows', media: 'rows.0.image' },
    prepare: ({ heading, rows, media }) => ({
      title: heading || `${rows?.length ?? 0} rows`,
      subtitle: 'Alternating feature rows',
      media
    })
  }
})
