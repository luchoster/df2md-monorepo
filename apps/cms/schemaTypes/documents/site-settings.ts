import { CogIcon } from '@sanity/icons/Cog'
import { defineArrayMember, defineField, defineType, type StringRule } from 'sanity'

const menuLink = defineArrayMember({
  name: 'menuLink',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'link', type: 'link', validation: (rule) => rule.required() })
  ],
  preview: { select: { title: 'label', subtitle: 'link.href', internal: 'link.internal.title' } }
})

/** An item in the black category bar; it can open a dropdown. */
const navItem = defineArrayMember({
  name: 'navItem',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'link',
      type: 'link',
      description: 'Where the label itself goes. Optional for "All brands".'
    }),
    defineField({
      name: 'dropdown',
      type: 'string',
      initialValue: 'none',
      options: {
        list: [
          { title: 'No dropdown', value: 'none' },
          { title: 'All brands', value: 'brands' },
          { title: 'Subcategories of the linked category', value: 'children' },
          { title: 'Custom links', value: 'custom' }
        ],
        layout: 'radio'
      }
    }),
    defineField({
      name: 'children',
      title: 'Dropdown links',
      type: 'array',
      of: [menuLink],
      hidden: ({ parent }) => parent?.dropdown !== 'custom'
    })
  ],
  validation: (rule) =>
    rule.custom(
      (item: { dropdown?: string; link?: { internal?: { _ref?: string } } } | undefined) =>
        item?.dropdown === 'children' && !item.link?.internal?._ref
          ? 'Subcategory dropdowns need the link to point at a category'
          : true
    ),
  preview: {
    select: { title: 'label', dropdown: 'dropdown' },
    prepare: ({ title, dropdown }) => ({
      title,
      subtitle: dropdown && dropdown !== 'none' ? `Dropdown: ${dropdown}` : undefined
    })
  }
})

const footerColumn = defineArrayMember({
  name: 'footerColumn',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'links', type: 'array', of: [menuLink] })
  ],
  preview: {
    select: { title: 'title', links: 'links' },
    prepare: ({ title, links }) => ({ title, subtitle: `${links?.length ?? 0} links` })
  }
})

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const time = (rule: StringRule) =>
  rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: '24h time (HH:mm)' })

/** Singleton, `_id: 'siteSettings'`. */
export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'navigation', title: 'Navigation', default: true },
    { name: 'footer', title: 'Footer' },
    { name: 'announcement', title: 'Promo bar' },
    { name: 'contact', title: 'Contact' },
    { name: 'delivery', title: 'Delivery' },
    { name: 'commerce', title: 'Autoship & tax' }
  ],
  fields: [
    defineField({
      name: 'mainMenu',
      title: 'Category bar',
      description: 'The black navigation bar under the logo',
      type: 'array',
      group: 'navigation',
      of: [navItem]
    }),

    defineField({ name: 'footerColumns', type: 'array', group: 'footer', of: [footerColumn] }),
    defineField({
      name: 'legalLinks',
      title: 'Copyright bar links',
      type: 'array',
      group: 'footer',
      of: [menuLink]
    }),
    defineField({
      name: 'social',
      type: 'object',
      group: 'footer',
      fields: [
        defineField({ name: 'instagram', type: 'url' }),
        defineField({ name: 'facebook', type: 'url' })
      ]
    }),

    defineField({
      name: 'announcement',
      title: 'Promo bar',
      description: 'The blue bar under the navigation',
      type: 'object',
      group: 'announcement',
      fields: [
        defineField({ name: 'active', type: 'boolean', initialValue: false }),
        defineField({ name: 'text', type: 'simple-content' }),
        defineField({ name: 'button', type: 'link' })
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
        defineField({
          name: 'mapUrl',
          title: 'Map link',
          description: 'Google Maps link for "View map"',
          type: 'url'
        }),
        defineField({ name: 'hours', type: 'text', rows: 3 })
      ]
    }),

    defineField({
      name: 'delivery',
      type: 'object',
      group: 'delivery',
      fields: [
        defineField({
          name: 'cutoffTime',
          title: 'Order cutoff (next-day delivery)',
          description: 'Orders after this time (Las Vegas time, HH:mm) deliver a day later',
          type: 'string',
          validation: time
        }),
        defineField({
          name: 'noDeliveryDays',
          title: 'Days without delivery',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          options: {
            list: WEEKDAYS.map((d) => ({ title: d[0]!.toUpperCase() + d.slice(1), value: d }))
          }
        }),
        defineField({
          name: 'holidays',
          title: 'Closed dates',
          type: 'array',
          of: [defineArrayMember({ type: 'date' })]
        }),
        defineField({
          name: 'allowTimeRequest',
          title: 'Let customers request a delivery time',
          type: 'boolean',
          initialValue: true
        }),
        defineField({
          name: 'timeWindow',
          type: 'object',
          options: { columns: 3 },
          hidden: ({ parent }) => !parent?.allowTimeRequest,
          fields: [
            defineField({ name: 'start', type: 'string', initialValue: '08:00', validation: time }),
            defineField({ name: 'end', type: 'string', initialValue: '18:00', validation: time }),
            defineField({ name: 'slotMinutes', type: 'number', initialValue: 30 })
          ]
        }),
        defineField({
          name: 'pickupEnabled',
          title: 'Offer pick up in store',
          type: 'boolean',
          initialValue: true
        }),
        defineField({
          name: 'pickupNote',
          type: 'string',
          initialValue: 'Your items will be available for pick up in 1 hour or less.',
          hidden: ({ parent }) => !parent?.pickupEnabled
        }),
        defineField({
          name: 'zipCodes',
          title: 'Delivery zip codes',
          description: 'Not used yet (zip checks are on hold).',
          type: 'array',
          of: [defineArrayMember({ type: 'string', validation: (rule) => rule.regex(/^\d{5}$/) })],
          options: { layout: 'tags' }
        }),
        defineField({
          name: 'areaLabel',
          title: 'Delivery area (text)',
          type: 'string',
          initialValue: 'Henderson, Las Vegas and Boulder City'
        })
      ]
    }),

    defineField({
      name: 'autoship',
      type: 'object',
      group: 'commerce',
      fields: [
        defineField({
          name: 'firstOrderDiscountPercent',
          title: 'First Autoship order discount (%)',
          description: 'Applies to the Autoship items of a customer’s first Autoship order',
          type: 'number',
          initialValue: 20,
          validation: (rule) => rule.min(0).max(100)
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
      name: 'taxRatePercent',
      title: 'Sales tax (%)',
      type: 'number',
      group: 'commerce',
      initialValue: 8.25,
      validation: (rule) => rule.min(0).max(20)
    })
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) }
})
