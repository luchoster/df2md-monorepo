import { ThListIcon } from '@sanity/icons/ThList'
import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Canonical table shape for the built-in Portable Text table editor (Studio ≥ 6.6).
 * `headerRows` must be declared or the header toggle silently does nothing.
 * Used for nutritional info and feeding guidelines (1,200+ imported HTML tables).
 */
export default defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  icon: ThListIcon,
  fields: [
    defineField({ name: 'headerRows', type: 'number', initialValue: 1 }),
    defineField({
      name: 'rows',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'row',
          type: 'object',
          fields: [
            defineField({
              name: 'cells',
              type: 'array',
              of: [
                defineArrayMember({
                  name: 'cell',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'value',
                      type: 'array',
                      of: [
                        defineArrayMember({
                          type: 'block',
                          styles: [{ title: 'Normal', value: 'normal' }],
                          lists: [],
                          marks: {
                            decorators: [
                              { title: 'Strong', value: 'strong' },
                              { title: 'Emphasis', value: 'em' }
                            ],
                            annotations: []
                          }
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    })
  ],
  preview: {
    select: { rows: 'rows' },
    prepare: ({ rows }) => ({
      title: 'Table',
      subtitle: `${rows?.length ?? 0} rows × ${rows?.[0]?.cells?.length ?? 0} columns`
    })
  }
})
