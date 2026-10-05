import { defineField } from 'sanity'
import { BACKGROUND_COLORS } from '../../lib/constants'

/** Every block gets the same padding field (gnar convention). */
export const paddingField = defineField({ name: 'padding', type: 'section-padding' })

export const backgroundField = (name = 'background', initialValue = 'white') =>
  defineField({ name, type: 'string', options: { list: BACKGROUND_COLORS }, initialValue })

/** Plain text of the first block in a Portable Text array, for previews. */
export const ptToText = (blocks?: { children?: { text?: string }[] }[]) =>
  blocks?.[0]?.children?.map((c) => c.text).join('') ?? ''
