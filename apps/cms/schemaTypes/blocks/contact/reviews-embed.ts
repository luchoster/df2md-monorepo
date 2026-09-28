import { CommentIcon } from '@sanity/icons'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { paddingField } from '../shared'

export default defineType({
  name: 'reviews-embed',
  title: 'Reviews',
  type: 'object',
  icon: CommentIcon,
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Reviews' }),
    defineField({
      name: 'provider',
      type: 'string',
      initialValue: 'manual',
      options: {
        list: [
          { title: 'Written here', value: 'manual' },
          { title: 'Google embed', value: 'google' },
          { title: 'Yelp embed', value: 'yelp' }
        ],
        layout: 'radio'
      }
    }),
    defineField({
      name: 'embedUrl',
      type: 'url',
      hidden: ({ parent }) => parent?.provider === 'manual'
    }),
    defineField({
      name: 'reviews',
      type: 'array',
      hidden: ({ parent }) => parent?.provider !== 'manual',
      of: [
        defineArrayMember({
          name: 'review',
          type: 'object',
          fields: [
            defineField({ name: 'author', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'rating',
              type: 'number',
              initialValue: 5,
              validation: (rule) => rule.required().min(1).max(5).integer()
            }),
            defineField({
              name: 'text',
              type: 'text',
              rows: 4,
              validation: (rule) => rule.required()
            })
          ],
          preview: {
            select: { title: 'author', rating: 'rating', text: 'text' },
            prepare: ({ title, rating, text }) => ({
              title: `${'★'.repeat(rating ?? 0)} ${title}`,
              subtitle: text
            })
          }
        })
      ]
    }),
    paddingField
  ],
  preview: {
    select: { heading: 'heading', provider: 'provider' },
    prepare: ({ heading, provider }) => ({
      title: heading || 'Reviews',
      subtitle: `Reviews · ${provider}`
    })
  }
})
