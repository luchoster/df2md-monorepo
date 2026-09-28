import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'

/** 1 … 4 5 6 … 20 style pages; hrefs keep the other query params. */
export function ShopPagination({
  page,
  pages,
  hrefFor
}: {
  page: number
  pages: number
  hrefFor: (p: number) => string
}) {
  if (pages <= 1) return null
  const window = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages))
  const list = [...window].sort((a, b) => a - b)
  return (
    <Pagination className="mt-10">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={hrefFor(page - 1)} />
          </PaginationItem>
        )}
        {list.map((p, i) => (
          <PaginationItem key={p}>
            {i > 0 && p - list[i - 1]! > 1 && <PaginationEllipsis className="inline-flex" />}
            <PaginationLink href={hrefFor(p)} isActive={p === page}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < pages && (
          <PaginationItem>
            <PaginationNext href={hrefFor(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  )
}
