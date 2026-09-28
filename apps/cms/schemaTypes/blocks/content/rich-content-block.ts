import { BlockContentIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { backgroundField, paddingField } from '../shared'

/** Same fields as gnar's rich-content-block. */
export default defineType({
  name: 'rich-content-block',
  title: 'Rich content',
  type: 'object',
  icon: BlockContentIcon,
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'content', type: 'block-content' }),
    backgroundField('backgroundColor'),
    defineField({
      name: 'textAlign',
      type: 'string',
      initialValue: 'left',
      options: { list: ['left', 'center', 'right'], layout: 'radio', direction: 'horizontal' }
    }),
    defineField({ name: 'showLink', type: 'boolean', initialValue: false }),
    defineField({ name: 'link', type: 'link', hidden: ({ parent }) => !parent?.showLink }),
    paddingField
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: title || 'Untitled', subtitle: 'Rich content' })
  }
})
