import { FolderIcon } from '@sanity/icons/Folder'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { paddingField } from '../shared'

export default defineType({
  name: 'category-grid',
  title: 'Category grid',
  type: 'object',
  icon: FolderIcon,
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'showAllTopLevel',
      title: 'Show all top-level categories',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
      hidden: ({ parent }) => parent?.showAllTopLevel,
      validation: (rule) => rule.unique()
    }),
    defineField({
      name: 'columns',
      type: 'number',
      initialValue: 4,
      options: { list: [2, 3, 4, 6], layout: 'radio', direction: 'horizontal' }
    }),
    paddingField
  ],
  preview: {
    select: { heading: 'heading' },
    prepare: ({ heading }) => ({ title: heading || 'Categories', subtitle: 'Category grid' })
  }
})
