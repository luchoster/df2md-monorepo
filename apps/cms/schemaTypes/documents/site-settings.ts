import { CogIcon } from '@sanity/icons/Cog'
import { defineArrayMember, defineField, defineType } from 'sanity'

const menuItem = defineArrayMember({
  name: 'menuItem',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'link', type: 'link', validation: (rule) => rule.required() })
  ],
  preview: { select: { title: 'label', subtitle: 'link.href' } }
})

/** Singleton, `_id: 'siteSettings'`. */
export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'navigation', title: 'Navigation', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'delivery', title: 'Delivery & Autoship' },
    { name: 'announcement', title: 'Announcement' }
  ],
  fields: [
    defineField({ name: 'mainMenu', type: 'array', group: 'navigation', of: [menuItem] }),
    defineField({ name: 'footerMenu', type: 'array', group: 'navigation', of: [menuItem] }),
    defineField({
      name: 'social',
      type: 'object',
      group: 'navigation',
      fields: [
        defineField({ name: 'facebook', type: 'url' }),
        defineField({ name: 'instagram', type: 'url' })
      ]
    }),
    defineField({
      name: 'contact',
      type: 'object',
      group: 'contact',
      fields: [
        defineField({ name: 'phone', type: 'string', initialValue: '702-971-2484' }),
        defineField({
          name: 'email',
          type: 'string',
          initialValue: 'info@dogfood2mydoor.com',
          validation: (rule) => rule.email()
        }),
        defineField({ name: 'address', type: 'text', rows: 3 }),
        defineField({ name: 'hours', type: 'text', rows: 3 })
      ]
    }),
    defineField({
      name: 'deliveryZipCodes',
      title: 'Delivery zip codes',
      description:
        'Zip codes we deliver to. Used by the zip-check block (not enforced at checkout).',
      type: 'array',
      group: 'delivery',
      of: [defineArrayMember({ type: 'string', validation: (rule) => rule.regex(/^\d{5}$/) })],
      options: { layout: 'tags' }
    }),
    defineField({
      name: 'autoship',
      type: 'object',
      group: 'delivery',
      fields: [
        defineField({
          name: 'firstOrderDiscountPercent',
          title: 'First Autoship order discount (%)',
          type: 'number',
          initialValue: 20,
          validation: (rule) => rule.min(0).max(100)
        }),
        defineField({
          name: 'intervals',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          options: {
            list: [
              { title: 'Days', value: 'day' },
              { title: 'Weeks', value: 'week' },
              { title: 'Months', value: 'month' }
            ]
          },
          initialValue: ['day', 'week', 'month']
        }),
        defineField({
          name: 'reminderDaysBefore',
          title: 'Send delivery reminder (days before)',
          type: 'number',
          initialValue: 3
        })
      ]
    }),
    defineField({
      name: 'announcement',
      type: 'object',
      group: 'announcement',
      fields: [
        defineField({ name: 'active', type: 'boolean', initialValue: false }),
        defineField({ name: 'text', type: 'simple-content' })
      ]
    })
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) }
})
