import { EnvelopeIcon } from '@sanity/icons'
import { defineField, defineType } from 'sanity'
import { backgroundField, paddingField } from '../shared'

/** Replaces zipcode-form.js + zipcode.php. The zip list lives in Site settings. */
export default defineType({
  name: 'zip-check',
  title: 'Delivery zip check',
  type: 'object',
  icon: EnvelopeIcon,
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Do we deliver to you?' }),
    defineField({ name: 'text', type: 'simple-content' }),
    defineField({ name: 'submitLabel', type: 'string', initialValue: 'Check' }),
    defineField({
      name: 'successMessage',
      title: 'Message when we deliver',
      type: 'simple-content'
    }),
    defineField({
      name: 'outsideAreaMessage',
      title: 'Message when outside the area',
      type: 'simple-content'
    }),
    defineField({
      name: 'recipientEmail',
      title: 'Notify this email',
      description: 'Every submission is emailed here. Empty = Site settings contact email.',
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
