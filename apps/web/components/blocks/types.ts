import type { PAGE_QUERY_RESULT } from '@/sanity.types'

export type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>['blocks']>[number]
export type BlockOf<T extends Block['_type']> = Extract<Block, { _type: T }>
