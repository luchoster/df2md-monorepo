import { LemonIcon } from '@sanity/icons/Lemon'
import { defineField, defineType } from 'sanity'
import { imageField } from './image'

/**
 * One flavor/recipe of a product, inline in `product.flavors[]`. Holds what differs per flavor
 * (picture, ingredients, guaranteed analysis). Variants point at it by name (`variant.flavor`).
 * Empty fields fall back to the product's own, so only fill in what is actually different.
 */
export default defineType({
  name: 'flavor',
  title: 'Flavor',
  type: 'object',
  icon: LemonIcon,
  fields: [
    defineField({
      name: 'name',
      description: 'e.g. "Beef & Rice". Variants use this exact name in their Flavor field.',
      type: 'string',
      validation: (rule) => rule.required()
    }),
    imageField({ name: 'image', altRequired: false }),
    defineField({
      name: 'description',
      description: 'Only when it differs from the product description',
      type: 'block-content'
    }),
    defineField({ name: 'nutritionalInfo', title: 'Nutritional info', type: 'block-content' }),
    defineField({
      name: 'feedingInstructions',
      title: 'Feeding instructions',
      type: 'block-content'
    }),
    defineField({ name: 'ingredientsAndUse', title: 'Ingredients & use', type: 'block-content' })
  ],
  preview: {
    select: { title: 'name', media: 'image', nutrition: 'nutritionalInfo' },
    prepare: ({ title, media, nutrition }) => ({
      title,
      subtitle: nutrition?.length ? 'Own nutrition facts' : undefined,
      media
    })
  }
})
