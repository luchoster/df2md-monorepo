import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Plain GET form: works without JS and lands on /shop?q=… (the old site used ?starts_with=). */
export function SearchForm({ className, id = 'site-search' }: { className?: string; id?: string }) {
  return (
    <search className={cn('relative block w-full', className)}>
      <form action="/shop" method="get">
        <label htmlFor={id} className="sr-only">
          Search products
        </label>
        <input
          id={id}
          name="q"
          type="search"
          placeholder="Search"
          className="h-14 w-full rounded-lg border border-white bg-white pr-12 pl-4 text-base font-normal text-ink-900 placeholder:text-body focus:outline-2 focus:outline-sky"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-body hover:text-brand"
        >
          <Search className="size-5" />
        </button>
      </form>
    </search>
  )
}
