import { defineField } from 'sanity'

/**
 * Where an imported document came from in WordPress. The import script finds documents by
 * `legacy.wpId` (never by guessing an `_id`), which makes re-runs idempotent.
 */
export const legacyField = (extra: ReturnType<typeof defineField>[] = []) =>
  defineField({
    name: 'legacy',
    title: 'Imported from WordPress',
    type: 'object',
    group: 'legacy',
    readOnly: true,
    fields: [
      defineField({ name: 'wpId', title: 'WordPress ID', type: 'number' }),
      defineField({ name: 'wpSlug', title: 'WordPress slug', type: 'string' }),
      ...extra,
      defineField({ name: 'importedAt', type: 'datetime' })
    ]
  })

export const legacyGroup = { name: 'legacy', title: 'Legacy' }
