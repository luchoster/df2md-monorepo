import { SplitHorizontalIcon } from '@sanity/icons/SplitHorizontal'
import { defineField, defineType } from 'sanity'
import { imageField } from '../../objects/image'
import { backgroundField, paddingField, ptToText } from '../shared'

export default defineType({
  name: 'image-text',
  title: 'Image + text',
  type: 'object',
  icon: SplitHorizontalIcon,
  fields: [
    defineField({ name: 'title', type: 'string' }),
    imageField({ name: 'image', required: true }),
    defineField({ name: 'content', type: 'simple-content' }),
    defineField({
      name: 'imageSide',
      type: 'string',
      initialValue: 'left',
      options: { list: ['left', 'right'], layout: 'radio', direction: 'horizontal' }
    }),
    defineField({ name: 'cta', title: 'Button', type: 'link' }),
    backgroundField(),
    paddingField
  ],
  preview: {
    select: { title: 'title', content: 'content', media: 'image' },
    prepare: ({ title, content, media }) => ({
      title: title || ptToText(content) || 'Image + text',
      subtitle: 'Image + text',
      media
    })
  }
})
