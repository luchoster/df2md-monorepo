import { defineField, defineType } from 'sanity'

const SIZES = [
  { title: 'None', value: 'none' },
  { title: 'Small', value: 'sm' },
  { title: 'Medium', value: 'md' },
  { title: 'Large', value: 'lg' }
]

export default defineType({
  name: 'section-padding',
  title: 'Section padding',
  type: 'object',
  options: { collapsible: true, collapsed: true, columns: 2 },
  fields: [
    defineField({ name: 'top', type: 'string', options: { list: SIZES }, initialValue: 'md' }),
    defineField({ name: 'bottom', type: 'string', options: { list: SIZES }, initialValue: 'md' })
  ]
})
