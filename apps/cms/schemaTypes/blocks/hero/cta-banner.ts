import { BulbOutlineIcon } from '@sanity/icons/BulbOutline'
import { defineField, defineType } from 'sanity'
import { imageField } from '../../objects/image'
import { backgroundField, paddingField, ptToText } from '../shared'

export default defineType({
  name: 'cta-banner',
  title: 'Call-to-action banner',
  type: 'object',
  icon: BulbOutlineIcon,
  fields: [
    defineField({ name: 'text', type: 'simple-content', validation: (rule) => rule.required() }),
    defineField({ name: 'button', type: 'link' }),
    backgroundField('background', 'brand'),
    imageField({ name: 'image', description: 'Optional background image' }),
    paddingField
  ],
  preview: {
    select: { text: 'text', media: 'image' },
    prepare: ({ text, media }) => ({
      title: ptToText(text) || 'CTA banner',
      subtitle: 'CTA banner',
      media
    })
  }
})
