import { ImagesIcon } from '@sanity/icons/Images'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField } from '../../objects/image'
import { paddingField } from '../shared'

export default defineType({
  name: 'hero-slider',
  title: 'Hero slider',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({
      name: 'slides',
      type: 'array',
      validation: (rule) => rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'slide',
          type: 'object',
          fields: [
            imageField({ name: 'image', required: true }),
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'text', type: 'simple-content' }),
            defineField({ name: 'buttonText', type: 'string', initialValue: 'Shop Now!' }),
            defineField({ name: 'link', type: 'link' }),
            defineField({
              name: 'textPosition',
              type: 'string',
              initialValue: 'left',
              options: { list: ['left', 'right'], layout: 'radio', direction: 'horizontal' }
            }),
            defineField({
              name: 'textBackground',
              title: 'Box behind text',
              type: 'boolean',
              initialValue: true
            })
          ],
          preview: {
            select: { title: 'title', subtitle: 'buttonText', media: 'image' },
            prepare: ({ title, subtitle, media }) => ({ title: title || 'Slide', subtitle, media })
          }
        })
      ]
    }),
    defineField({ name: 'autoplay', type: 'boolean', initialValue: true }),
    defineField({
      name: 'intervalMs',
      title: 'Autoplay interval (ms)',
      type: 'number',
      initialValue: 6000,
      hidden: ({ parent }) => !parent?.autoplay
    }),
    paddingField
  ],
  preview: {
    select: { slides: 'slides', media: 'slides.0.image' },
    prepare: ({ slides, media }) => ({
      title: `${slides?.length ?? 0} slide(s)`,
      subtitle: 'Hero slider',
      media
    })
  }
})
