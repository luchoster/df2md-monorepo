import { PinIcon } from '@sanity/icons/Pin'
import { defineField, defineType } from 'sanity'
import { paddingField } from '../shared'

/** Fields left empty fall back to Site settings → Contact. */
export default defineType({
  name: 'contact-map',
  title: 'Contact + map',
  type: 'object',
  icon: PinIcon,
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Contact Us' }),
    defineField({ name: 'text', type: 'simple-content' }),
    defineField({ name: 'phone', type: 'string', description: 'Empty = Site settings' }),
    defineField({
      name: 'email',
      type: 'string',
      description: 'Empty = Site settings',
      validation: (rule) => rule.email()
    }),
    defineField({ name: 'address', type: 'text', rows: 3, description: 'Empty = Site settings' }),
    defineField({ name: 'hours', type: 'text', rows: 3, description: 'Empty = Site settings' }),
    defineField({
      name: 'mapEmbedUrl',
      title: 'Google Maps embed URL',
      description: 'Google Maps → Share → Embed a map → copy the src="…" value',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['https'] })
    }),
    defineField({
      name: 'showForm',
      title: 'Show contact form',
      description: 'Name, email and question, emailed to the shop',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'formHeading',
      type: 'string',
      initialValue: 'Ask us anything',
      hidden: ({ parent }) => !parent?.showForm
    }),
    defineField({
      name: 'recipientEmail',
      title: 'Send questions to',
      description: 'Empty = Site settings → Contact email',
      type: 'string',
      validation: (rule) => rule.email(),
      hidden: ({ parent }) => !parent?.showForm
    }),
    paddingField
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: heading || 'Contact', subtitle: 'Contact + map' })
  }
})
