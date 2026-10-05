import { defineArrayMember, defineField } from 'sanity'

/**
 * Sanity's `image` type can't be redefined, so every image field in this studio is built from
 * these helpers: hotspot on, plus an `alt` field. `alt` is required on editorial images and a
 * warning on imported catalog images (most WP attachments have no alt text).
 */
const altField = (required: boolean) =>
  defineField({
    name: 'alt',
    title: 'Alternative text',
    type: 'string',
    description: 'Describe the image for screen readers',
    validation: (rule) =>
      required
        ? rule.custom((alt, ctx) =>
            (ctx.parent as { asset?: unknown } | undefined)?.asset && !alt ? 'Required' : true
          )
        : rule
            .custom((alt, ctx) =>
              (ctx.parent as { asset?: unknown } | undefined)?.asset && !alt
                ? 'Add alt text when you can'
                : true
            )
            .warning()
  })

type ImageOptions = {
  name: string
  title?: string
  required?: boolean
  altRequired?: boolean
  group?: string
  description?: string
}

export const imageField = ({ required, altRequired = true, ...rest }: ImageOptions) =>
  defineField({
    ...rest,
    type: 'image',
    options: { hotspot: true },
    fields: [altField(altRequired)],
    validation: required ? (rule) => rule.required() : undefined
  })

export const imageMember = ({ altRequired = true }: { altRequired?: boolean } = {}) =>
  defineArrayMember({
    type: 'image',
    options: { hotspot: true },
    fields: [altField(altRequired)]
  })
