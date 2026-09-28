import { PackageIcon } from '@sanity/icons/Package'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField, imageMember } from '../objects/image'
import { legacyField, legacyGroup } from '../objects/legacy'

type Variant = { _key: string; price?: number }

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  groups: [
    { name: 'main', title: 'Product', default: true },
    { name: 'variants', title: 'Sizes & prices' },
    { name: 'details', title: 'Details' },
    { name: 'content', title: 'Page blocks' },
    { name: 'seo', title: 'SEO' },
    legacyGroup
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'main',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'main',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'status',
      type: 'string',
      group: 'main',
      initialValue: 'active',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Draft (hidden from shop)', value: 'draft' },
          { title: 'Archived', value: 'archived' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'brand',
      type: 'reference',
      to: [{ type: 'brand' }],
      group: 'main',
      validation: (rule) => rule.required()
    }),
    defineField({
      name: 'categories',
      type: 'array',
      group: 'main',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
      validation: (rule) => rule.required().min(1).unique()
    }),
    defineField({
      name: 'primaryCategory',
      type: 'reference',
      to: [{ type: 'category' }],
      group: 'main',
      description: 'Used for breadcrumbs. Should be one of the categories above.',
      validation: (rule) =>
        rule
          .custom((value, ctx) => {
            if (!value?._ref) return true
            const cats = (ctx.document?.categories as { _ref: string }[] | undefined) ?? []
            return cats.some((c) => c._ref === value._ref) || 'Not one of the product’s categories'
          })
          .warning()
    }),
    defineField({ name: 'featured', type: 'boolean', group: 'main', initialValue: false }),
    imageField({ name: 'mainImage', title: 'Main image', group: 'main', altRequired: false }),
    defineField({
      name: 'gallery',
      type: 'array',
      group: 'main',
      of: [imageMember({ altRequired: false })],
      options: { layout: 'grid' }
    }),
    defineField({ name: 'shortDescription', type: 'text', rows: 3, group: 'main' }),
    defineField({ name: 'description', type: 'block-content', group: 'main' }),

    defineField({
      name: 'optionName',
      title: 'Option name',
      description: 'Label above the variant dropdown',
      type: 'string',
      group: 'variants',
      initialValue: 'Size',
      options: { list: ['Size', 'Flavor', 'Color'] }
    }),
    defineField({
      name: 'variants',
      type: 'array',
      group: 'variants',
      of: [defineArrayMember({ type: 'variant' })],
      validation: (rule) =>
        rule
          .required()
          .min(1)
          .custom((variants: Variant[] | undefined) =>
            variants?.some((v) => typeof v.price === 'number' && v.price > 0)
              ? true
              : 'At least one variant needs a price'
          )
    }),
    defineField({
      name: 'defaultVariantKey',
      title: 'Default variant',
      type: 'string',
      group: 'variants',
      description: 'The variant _key preselected on the product page. Empty = first variant.',
      validation: (rule) =>
        rule.custom((value, ctx) => {
          if (!value) return true
          const variants = (ctx.document?.variants as Variant[] | undefined) ?? []
          return variants.some((v) => v._key === value) || 'Does not match any variant'
        })
    }),
    defineField({
      name: 'noDiscounts',
      title: 'Excluded from discounts',
      description:
        'No first-Autoship or other discounts (e.g. brands with minimum advertised pricing). Autoship itself is still allowed.',
      type: 'boolean',
      group: 'variants',
      initialValue: false
    }),
    defineField({
      name: 'autoshipEligible',
      title: 'Available for Autoship',
      type: 'boolean',
      group: 'variants',
      initialValue: true
    }),

    defineField({
      name: 'showAdditionalInfo',
      title: 'Show nutrition / feeding tabs',
      type: 'boolean',
      group: 'details',
      initialValue: true
    }),
    defineField({
      name: 'nutritionalInfo',
      title: 'Nutritional info',
      type: 'block-content',
      group: 'details'
    }),
    defineField({
      name: 'feedingInstructions',
      title: 'Feeding instructions',
      type: 'block-content',
      group: 'details'
    }),
    defineField({
      name: 'ingredientsAndUse',
      title: 'Ingredients & use',
      type: 'block-content',
      group: 'details'
    }),
    defineField({
      name: 'tags',
      type: 'array',
      group: 'details',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' }
    }),

    defineField({
      name: 'blocksAbove',
      title: 'Blocks above product',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({ type: 'rich-content-block' }),
        defineArrayMember({ type: 'cta-banner' })
      ]
    }),
    defineField({
      name: 'blocksBelow',
      title: 'Blocks below product',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({ type: 'rich-content-block' }),
        defineArrayMember({ type: 'product-grid' }),
        defineArrayMember({ type: 'cta-banner' })
      ]
    }),

    defineField({ name: 'seo', type: 'meta', group: 'seo' }),
    legacyField()
  ],
  orderings: [
    { title: 'Title', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
    {
      title: 'Recently imported',
      name: 'importedDesc',
      by: [{ field: 'legacy.importedAt', direction: 'desc' }]
    }
  ],
  preview: {
    select: {
      title: 'title',
      brand: 'brand.title',
      price: 'variants.0.price',
      status: 'status',
      media: 'mainImage'
    },
    prepare: ({ title, brand, price, status, media }) => ({
      title,
      subtitle: [
        brand,
        price != null ? `from $${Number(price).toFixed(2)}` : null,
        status && status !== 'active' ? status.toUpperCase() : null
      ]
        .filter(Boolean)
        .join(' · '),
      media
    })
  }
})
