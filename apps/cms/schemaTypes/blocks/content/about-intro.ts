import { UsersIcon } from '@sanity/icons/Users'
import { defineField, defineType } from 'sanity'
import { imageMember } from '../../objects/image'
import { backgroundField, paddingField } from '../shared'

/** shadcnblocks About 37: headline and button beside a paragraph, then two photos. */
export default defineType({
  name: 'about-intro',
  title: 'About intro + photo pair',
  type: 'object',
  icon: UsersIcon,
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'description', type: 'text', rows: 4 }),
    defineField({ name: 'button', type: 'link' }),
    defineField({
      name: 'images',
      type: 'array',
      of: [imageMember()],
      validation: (rule) => rule.max(2),
      options: { layout: 'grid' }
    }),
    backgroundField(),
    paddingField
  ],
  preview: {
    select: { title: 'heading', media: 'images.0' },
    prepare: ({ title, media }) => ({ title, subtitle: 'About intro', media })
  }
})
