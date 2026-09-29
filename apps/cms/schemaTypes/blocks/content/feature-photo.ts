import { ImageIcon } from '@sanity/icons/Image'
import { defineField, defineType } from 'sanity'
import { imageField } from '../../objects/image'
import { backgroundField, paddingField } from '../shared'

/** shadcnblocks Feature 109: copy and a button beside a photo with text laid over it. */
export default defineType({
  name: 'feature-photo',
  title: 'Feature + photo overlay',
  type: 'object',
  icon: ImageIcon,
  groups: [
    { name: 'copy', title: 'Copy', default: true },
    { name: 'photo', title: 'Photo' }
  ],
  fields: [
    defineField({ name: 'badge', type: 'string', group: 'copy' }),
    defineField({
      name: 'heading',
      type: 'string',
      group: 'copy',
      validation: (rule) => rule.required()
    }),
    defineField({ name: 'description', type: 'text', rows: 3, group: 'copy' }),
    defineField({ name: 'button', type: 'link', group: 'copy' }),
    imageField({ name: 'image', required: true, group: 'photo' }),
    defineField({
      name: 'imageSide',
      type: 'string',
      group: 'photo',
      initialValue: 'right',
      options: { list: ['left', 'right'], layout: 'radio', direction: 'horizontal' }
    }),
    defineField({
      name: 'chip',
      title: 'Chip text',
      description: 'Small pill in the top corner of the photo',
      type: 'string',
      group: 'photo'
    }),
    imageField({ name: 'chipImage', title: 'Chip image', altRequired: false, group: 'photo' }),
    defineField({
      name: 'overlayHeading',
      title: 'Text on the photo',
      type: 'string',
      group: 'photo'
    }),
    defineField({ name: 'overlayLink', title: 'Link on the photo', type: 'link', group: 'photo' }),
    backgroundField(),
    paddingField
  ],
  preview: {
    select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({ title, subtitle: 'Feature + photo overlay', media })
  }
})
