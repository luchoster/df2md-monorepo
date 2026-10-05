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
    defineField({
      name: 'decoration',
      type: 'string',
      initialValue: 'none',
      description: 'Built-in background artwork, used when no image is set',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Dog Food 2 My Door badge', value: 'badge' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      }
    }),
    defineField({
      name: 'size',
      type: 'string',
      initialValue: 'band',
      options: {
        list: [
          { title: 'Slim bar', value: 'bar' },
          { title: 'Tall band', value: 'band' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      }
    }),
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
