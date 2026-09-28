import { cn } from '@/lib/utils'

import { Price, PriceValue } from '@/components/shadcnblocks/price'
import { Rating } from '@/components/shadcnblocks/rating'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
interface ProductPrice {
  regular: number
  sale?: number
  currency: string
}

interface Product {
  name: string
  brand: string
  rate: number
  image: {
    src: string
    alt: string
  }
  link: string
  price: ProductPrice
}

const PRODUCT_CARD: Product = {
  image: {
    src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/Sporty-Casual-Portrait-1.png',
    alt: 'Pink cropped top with chic design'
  },
  name: 'Rosé Cut Crop Top',
  brand: 'Rosé Atelier',
  link: '#',
  price: {
    regular: 59.0,
    currency: 'USD'
  },
  rate: 5
}

interface ProductCard4Props {
  className?: string
}

const ProductCard4 = ({ className }: ProductCard4Props) => {
  const { regular, sale, currency } = PRODUCT_CARD.price

  return (
    <a href={PRODUCT_CARD.link} className={cn('block min-w-47.5 md:max-w-80', className)}>
      <Card className="group h-full min-h-105 gap-3.5 rounded-sm border-none bg-card p-2 shadow-none">
        <CardHeader className="block p-0">
          <div className="h-80 w-full overflow-hidden rounded-sm">
            <img
              src={PRODUCT_CARD.image.src}
              alt={PRODUCT_CARD.image.alt}
              className="block size-full object-cover object-center"
            />
          </div>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-2 px-2 pb-1">
          <div className="mb-1.5 flex justify-between gap-2">
            <div className="text-xs font-medium text-muted-foreground uppercase">
              {PRODUCT_CARD.brand}
            </div>
            <Rating
              rate={PRODUCT_CARD.rate}
              className="[&_svg]:size-3.5 [&_svg]:fill-yellow-500 [&_svg]:stroke-yellow-500 [&>div]:size-3.5"
            />
          </div>
          <CardTitle className="text-lg leading-tight font-semibold">{PRODUCT_CARD.name}</CardTitle>
          <Price onSale={sale != null} className="text-lg font-semibold">
            <PriceValue price={regular} currency={currency} variant="regular" />
            <PriceValue price={sale} currency={currency} variant="sale" />
          </Price>
        </CardContent>
      </Card>
    </a>
  )
}

export { ProductCard4 }
