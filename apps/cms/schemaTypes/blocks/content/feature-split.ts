import { SplitVerticalIcon } from '@sanity/icons/SplitVertical'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField } from '../../objects/image'
import { backgroundField, paddingField } from '../shared'

/** shadcnblocks Feature 6: heading, text and a checklist beside a square image. */
export default defineType({
  name: 'feature-split',
  title: 'Feature + checklist',
  type: 'object',
  icon: SplitVerticalIcon,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({
      name: 'checklist',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.max(6)
    }),
    imageField({ name: 'image', required: true }),
    defineField({
      name: 'imageSide',
      type: 'string',
      initialValue: 'right',
      options: { list: ['left', 'right'], layout: 'radio', direction: 'horizontal' }
    }),
    defineField({ name: 'button', type: 'link' }),
    backgroundField(),
    paddingField
  ],
  preview: {
    select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({ title, subtitle: 'Feature + checklist', media })
  }
})
