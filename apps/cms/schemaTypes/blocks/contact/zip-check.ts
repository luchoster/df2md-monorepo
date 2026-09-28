import { EnvelopeIcon } from '@sanity/icons/Envelope'
import { defineField, defineType } from 'sanity'
import { backgroundField, paddingField } from '../shared'

/**
 * Replaces zipcode-form.js + zipcode.php: name, email, phone, a zip dropdown (Site settings →
 * Delivery zip codes, plus "Other") and a message. Every submission is emailed to the shop; the
 * visitor sees the in-area message for a listed zip and the outside-area message for "Other".
 */
export default defineType({
  name: 'zip-check',
  title: 'Delivery zip check',
  type: 'object',
  icon: EnvelopeIcon,
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Do we deliver to you?' }),
    defineField({ name: 'text', type: 'simple-content' }),
    defineField({ name: 'submitLabel', type: 'string', initialValue: 'Check my zip code' }),
    defineField({
      name: 'inAreaMessage',
      title: 'Message when we deliver',
      type: 'simple-content',
      description: 'Shown after submitting with one of the listed zip codes'
    }),
    defineField({
      name: 'outsideAreaMessage',
      title: 'Message when outside the area',
      type: 'simple-content',
      description: 'Shown after submitting with "Other" (a delivery request)'
    }),
    defineField({
      name: 'recipientEmail',
      title: 'Send requests to',
      description: 'Empty = Site settings → Contact email',
      type: 'string',
      validation: (rule) => rule.email()
    }),
    backgroundField('background', 'sun-soft'),
    paddingField
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: heading || 'Zip check', subtitle: 'Delivery zip check' })
  }
})
