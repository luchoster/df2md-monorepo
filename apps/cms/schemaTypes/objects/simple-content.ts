import { defineArrayMember, defineType } from 'sanity'
import { linkAnnotation } from './block-content'

/** Short text: captions, banners, FAQ answers. No headings, lists or embeds. */
export default defineType({
  name: 'simple-content',
  title: 'Text',
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
        annotations: [linkAnnotation]
      }
    })
  ]
})
