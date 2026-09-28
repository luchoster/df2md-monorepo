import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageMember } from './image'

/** Link annotation shared by both Portable Text flavours. */
export const linkAnnotation = defineArrayMember({
  name: 'link',
  type: 'object',
  title: 'Link',
  fields: [
    defineField({
      name: 'href',
      type: 'url',
      validation: (rule) =>
        rule.required().uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] })
    }),
    defineField({ name: 'openInNewTab', type: 'boolean', initialValue: false })
  ]
})

/** Full rich text: headings, lists, links, images and native tables. */
export default defineType({
  name: 'block-content',
  title: 'Rich content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' }
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' }
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
          { title: 'Underline', value: 'underline' }
        ],
        annotations: [linkAnnotation]
      }
    }),
    imageMember(),
    defineArrayMember({ type: 'table' })
  ]
})
