import { Select } from '@sanity/ui'
import type { ChangeEvent } from 'react'
import { type StringInputProps, set, unset, useFormValue } from 'sanity'

type Option = { value: string; title: string }

/**
 * A string field picked from another list in the same document (e.g. a variant's flavor from
 * the product's Flavors). Stores the plain string, so queries and the site don't change.
 * A saved value that's no longer in the list stays visible, marked, until it's changed.
 */
export function listSelectInput<T>(
  path: string[],
  toOption: (item: T) => Option | null,
  emptyLabel = 'Select…'
) {
  return function ListSelectInput({ value, onChange, elementProps, readOnly }: StringInputProps) {
    const items = (useFormValue(path) as T[] | undefined) ?? []
    const options = items.map(toOption).filter((o): o is Option => Boolean(o?.value))
    const known = !value || options.some((o) => o.value === value)
    return (
      <Select
        id={elementProps.id}
        readOnly={readOnly}
        value={value ?? ''}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
          const next = e.currentTarget.value
          onChange(next ? set(next) : unset())
        }}
      >
        <option value="">{emptyLabel}</option>
        {!known && <option value={value}>{value} (not in the list)</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.title}
          </option>
        ))}
      </Select>
    )
  }
}
