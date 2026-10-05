import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Plain GET form: works without JS and lands on /shop?q=… (the old site used ?starts_with=). */
export function SearchForm({ className, id = 'site-search' }: { className?: string; id?: string }) {
  return (
    <search className={cn('relative block w-full', className)}>
      <form action="/shop" method="get">
        <label htmlFor={id} className="sr-only">
          Search products
        </label>
        <Input
          id={id}
          name="q"
          type="search"
          placeholder="Search"
          className="h-12 rounded-lg border-white bg-white pr-12 pl-4 text-base text-foreground shadow-none md:h-14 md:text-base"
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
