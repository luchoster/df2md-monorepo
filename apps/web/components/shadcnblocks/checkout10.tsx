'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Asterisk } from 'lucide-react'
import type { SubmitHandler } from 'react-hook-form'
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form'
import z from 'zod'
import type { PriceType } from '@/components/shadcnblocks/price'
import { Price, PriceValue } from '@/components/shadcnblocks/price'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Product = {
  product_id: string
  name: string
  image: string
  price: PriceType
  quantity: number
}

type SummaryItem = {
  label: string
  value: number | string
}

type Summary = {
  currency: string
  subtotal: SummaryItem
  shipping: SummaryItem
  tax: SummaryItem
  total: SummaryItem
}

type Card = {
  id: string
  last4: string
  holderName: string
  expiryDate: string
  bankLogo: string
}

type ShippingAddress = {
  id: string
  title: string
  city: string
  country: string
  address: string
}

type ShippingMethod = {
  id: string
  image: string
  name: string
  delivery: string
  price: number
  currency: string
}

interface CardProps extends Card {
  checked?: boolean
}

interface ProductsListProps {
  products?: Product[]
}

interface ProductItemProps {
  product?: Product
}

interface SummaryProps {
  summary?: Summary
}

type CheckoutData = {
  products: Product[]
  summary: Summary
  cards?: Card[]
  shippingAddresses: ShippingAddress[]
  shippingMethods: ShippingMethod[]
}

interface CardFieldsProps {
  cards?: Card[]
}

interface ShippingDetailsFieldsProps {
  shippingAddresses: ShippingAddress[]
  shippingMethods: ShippingMethod[]
}

interface Checkout10Props extends CheckoutData {
  className?: string
}

const CHECKOUT_DATA: CheckoutData = {
  products: [
    {
      product_id: 'product-1',
      name: 'Stylish Maroon Sneaker',
      image:
        'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/stylish-maroon-sneaker.png',
      price: {
        regular: 354.0,
        currency: 'USD'
      },
      quantity: 1
    },
    {
      product_id: 'product-2',
      name: 'Bicolor Sweatshirt with Embroidered Logo',
      image:
        'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/bicolor-crewneck-sweatshirt-with-embroidered-logo.png',
      price: {
        regular: 499.0,
        currency: 'USD'
      },
      quantity: 1
    },
    {
      product_id: 'product-3',
      name: 'Maroon Leather Handbag',
      image:
        'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/maroon-leather-handbag.png',
      price: {
        regular: 245.0,
        currency: 'USD'
      },
      quantity: 1
    }
  ],
  summary: {
    currency: 'USD',
    subtotal: {
      label: 'Subtotal',
      value: 398.0
    },
    shipping: {
      label: 'Shipping',
      value: 'FREE'
    },
    tax: {
      label: 'Tax',
      value: 'Calculated at next step'
    },
    total: {
      label: 'Total',
      value: 398.0
    }
  },
  cards: [
    {
      id: 'card-1',
      last4: '1234',
      holderName: 'Jhon Doe',
      expiryDate: '12/26',
      bankLogo:
        'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/payments/chase-white-wordmark.svg'
    },
    {
      id: 'card-2',
      last4: '1234',
      holderName: 'Jhon Doe',
      expiryDate: '04/27',
      bankLogo:
        'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/payments/chase-white-wordmark.svg'
    }
  ],
  shippingAddresses: [
    {
      id: 'home-1',
      title: 'Home',
      city: 'New York, NY 10001',
      country: 'United States',
      address: '350 5th Avenue, Apt 21B'
    },
    {
      id: 'office-1',
      title: 'Office',
      city: 'Austin, TX 78701',
      country: 'United States',
      address: '600 Congress Avenue, Suite 1400'
    }
  ],
  shippingMethods: [
    {
      id: 'payment-method-1',
      image: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/block-2.svg',
      name: 'Standard Shipping',
      delivery: '3–5 Business Days',
      price: 10,
      currency: 'USD'
    },
    {
      id: 'payment-method-2',
      image: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/block-4.svg',
      name: 'Express Shipping',
      delivery: '1–2 Business Days',
      price: 25,
      currency: 'USD'
    }
  ]
}

const checkoutFormSchema = z.object({
  fullname: z.string(),
  email: z.email(),
  phone: z.string(),
  country: z.string(),
  address: z.string(),
  postalCode: z.string(),
  city: z.string(),
  card: z.string(),
  shippingAddress: z.string(),
  shippingMethod: z.string(),
  products: z
    .object({
      product_id: z.string(),
      quantity: z.number(),
      price: z.number()
    })
    .array()
})

type CheckoutFormType = z.infer<typeof checkoutFormSchema>

const Checkout10 = ({
  className,
  products = CHECKOUT_DATA.products,
  summary = CHECKOUT_DATA.summary,
  cards = CHECKOUT_DATA.cards,
  shippingAddresses = CHECKOUT_DATA.shippingAddresses,
  shippingMethods = CHECKOUT_DATA.shippingMethods
}: Checkout10Props) => {
  const defaultProducts = products.map((item) => ({
    product_id: item.product_id,
    price: item.price.sale ?? item.price.regular,
    quantity: item.quantity
  }))

  const form = useForm({
    defaultValues: {
      products: defaultProducts
    },
    resolver: zodResolver(checkoutFormSchema)
  })

  const onSubmit: SubmitHandler<CheckoutFormType> = (data: CheckoutFormType) => {
    console.log(data)
  }

  return (
    <section className={cn('py-32', className)}>
      <div className="container">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="space-y-5">
                  <h2 className="text-2xl leading-normal font-semibold tracking-tight sm:text-3xl md:text-4xl">
                    Payment Information
                  </h2>
                  <div className="space-y-8 rounded-sm border bg-accent p-3 sm:p-5">
                    <PersonalDetailsFields />
                    <Separator />
                    <CardFields cards={cards} />
                  </div>
                  <h2 className="text-2xl leading-normal font-semibold tracking-tight sm:text-3xl md:text-4xl">
                    Shipping Details
                  </h2>
                  <div className="space-y-8 rounded-sm border bg-accent p-5">
                    <ShippingDetailsFields
                      shippingAddresses={shippingAddresses}
                      shippingMethods={shippingMethods}
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="space-y-5">
                  <h2 className="text-2xl leading-normal font-semibold tracking-tight sm:text-3xl md:text-4xl">
                    Cart
                  </h2>
                  <div className="rounded-sm border bg-accent p-3 sm:p-5">
                    <div className="space-y-6">
                      <ProductsList products={products} />
                      <Summary summary={summary} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </section>
  )
}

const PersonalDetailsFields = () => {
  const { control } = useFormContext<CheckoutFormType>()

  return (
    <FieldSet>
      <FieldLegend className="text-xl! leading-normal font-medium tracking-tight">
        Payment Details
      </FieldLegend>
      <FieldDescription>This appears on invoices and emails.</FieldDescription>
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <Controller
          name="fullname"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-3" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="fullname">Full name</FieldLabel>
              <Input
                {...field}
                id="fullname"
                placeholder="Evil Rabbit"
                className="bg-background"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>This appears on invoices and emails.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-3" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
              <Input
                {...field}
                id="phone"
                placeholder="Phone Number"
                className="bg-background"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-3" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                placeholder="Email Address"
                className="bg-background"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>This appears on invoices and emails.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="address"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-3" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="address">Address</FieldLabel>
              <Input
                {...field}
                id="address"
                placeholder="Address"
                className="bg-background"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="country"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel>Country</FieldLabel>
              <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={fieldState.invalid} className="bg-background">
                  <SelectValue placeholder="Choose a Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="city"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input
                {...field}
                id="city"
                placeholder="City"
                className="bg-background"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="postalCode"
          control={control}
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="postalCode">Postal Code</FieldLabel>
              <Input
                {...field}
                id="postalCode"
                placeholder="Postal Code"
                className="bg-background"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
    </FieldSet>
  )
}

const CardFields = ({ cards }: CardFieldsProps) => {
  const { control } = useFormContext<CheckoutFormType>()

  if (!cards) return

  return (
    <Controller
      name="card"
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet>
          <FieldLegend className="text-xl! leading-normal font-medium tracking-tight">
            Your Saved Cards
          </FieldLegend>
          <FieldDescription>Yearly and lifetime plans offer significant savings.</FieldDescription>
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {cards.map((card) => (
              <FieldLabel
                key={card.id}
                htmlFor={`form-card-${card.id}`}
                className="border-0! [&>*]:data-[slot=field]:p-0"
              >
                <Field data-invalid={fieldState.invalid}>
                  <FieldContent className="cursor-pointer p-0">
                    <Card {...card} checked={card.id === field.value} />
                  </FieldContent>
                  <RadioGroupItem
                    value={card.id}
                    id={`form-card-${card.id}`}
                    aria-invalid={fieldState.invalid}
                    className="sr-only"
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </FieldSet>
      )}
    />
  )
}

const Card = ({ checked, last4, holderName, expiryDate, bankLogo }: CardProps) => {
  const GROUPS = 3
  const ASTERISKS_PER_GROUP = 4
  return (
    <div
      className={cn(
        '[container-type:_inline-size] relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-[4%/8%] border bg-primary text-primary-foreground transition-colors',
        !checked && 'grayscale',
        checked && 'bg-blue-600'
      )}
    >
      <div className="absolute top-0 left-0 w-[20%] -translate-[30%]">
        <div
          className={cn(
            'aspect-square rounded-full bg-white/20',
            'after:absolute after:top-1/2 after:left-1/2 after:block after:aspect-square after:w-full after:-translate-1/2 after:scale-190 after:rounded-full after:bg-white/15',
            'before:absolute before:top-1/2 before:left-1/2 before:block before:aspect-square before:w-full before:-translate-1/2 before:scale-280 before:rounded-full before:bg-white/10'
          )}
        ></div>
      </div>
      <div className="absolute right-[2.5%] bottom-[0%] w-[18%]">
        <img
          src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblocks-logo.svg"
          alt="Shadcnblocks Logo"
          className="w-full opacity-60 invert"
        />
      </div>
      {bankLogo && (
        <div className="absolute top-[12%] right-[8%] w-[22%]">
          <img src={bankLogo} alt="Bank Logo" />
        </div>
      )}

      <div className="relative z-10 h-[70%] w-[84%]">
        <div className="flex size-full flex-col justify-between">
          <div className="space-y-[1cqh]">
            <div className="text-[4cqw] text-shadow-xs">Card Number</div>
            <div className="flex items-center space-x-[1.5cqw]">
              {Array.from({ length: GROUPS }).map((_, groupIndex) => (
                <div key={groupIndex} className="flex items-center -space-x-[0.9cqw]">
                  {Array.from({ length: ASTERISKS_PER_GROUP }).map((_, i) => (
                    <Asterisk key={i} className="size-[3.8cqw] drop-shadow-xs" />
                  ))}
                </div>
              ))}
              <div className="text-[3.8cqw] text-shadow-xs">{last4}</div>
            </div>
          </div>
          <div className="flex space-x-[8cqw]">
            <div className="space-y-[0.6cqh]">
              <div className="text-[3.5cqw] uppercase opacity-75 text-shadow-xs">Valid thru</div>
              <div className="text-[3.5cqw] text-shadow-xs">{expiryDate}</div>
            </div>
            <div className="space-y-[0.6cqh]">
              <div className="text-[3.5cqw] uppercase opacity-75 text-shadow-xs">Card Holder</div>
              <div className="text-[3.5cqw] text-shadow-xs">{holderName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingDetailsFields = ({
  shippingAddresses,
  shippingMethods
}: ShippingDetailsFieldsProps) => {
  const { control } = useFormContext<CheckoutFormType>()

  return (
    <div className="space-y-8">
      <Controller
        name="shippingAddress"
        control={control}
        render={({ field, fieldState }) => (
          <FieldSet>
            <FieldLegend variant="label" className="text-lg!">
              Shipping Address
            </FieldLegend>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-1 md:grid-cols-2"
            >
              {shippingAddresses.map((address) => (
                <FieldLabel
                  key={address.id}
                  htmlFor={`form-shipping-address-${address.id}`}
                  className="bg-background"
                >
                  <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldTitle>{address.title}</FieldTitle>
                      <FieldDescription>
                        {address.city}, {address.country}
                        <br />
                        {address.address}
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value={address.id}
                      id={`form-shipping-address-${address.id}`}
                      aria-invalid={fieldState.invalid}
                    />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldSet>
        )}
      />
      <Controller
        name="shippingMethod"
        control={control}
        render={({ field, fieldState }) => (
          <FieldSet>
            <FieldLegend variant="label" className="text-lg!">
              Shipping Methods
            </FieldLegend>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              className="grid grid-cols-1 md:grid-cols-2"
            >
              {shippingMethods.map((method) => (
                <FieldLabel
                  key={method.id}
                  htmlFor={`form-method-method-${method.id}`}
                  className="bg-background"
                >
                  <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                    <FieldContent className="flex-row gap-4">
                      <div className="w-10">
                        <AspectRatio className="overflow-hidden">
                          <img
                            src={method.image}
                            alt={method.name}
                            className="block size-full object-cover object-center"
                          />
                        </AspectRatio>
                      </div>
                      <div className="space-y-1.5">
                        <FieldTitle>{method.name}</FieldTitle>
                        <FieldDescription>{method.delivery}</FieldDescription>
                        <Price>
                          <PriceValue
                            className="text-sm text-muted-foreground"
                            currency={method.currency}
                            price={method.price}
                          />
                        </Price>
                      </div>
                    </FieldContent>
                    <RadioGroupItem
                      value={method.id}
                      id={`form-method-address-${method.id}`}
                      aria-invalid={fieldState.invalid}
                    />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldSet>
        )}
      />
    </div>
  )
}

const ProductsList = ({ products }: ProductsListProps) => {
  if (!products) return

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <ItemGroup className="gap-4">
        {products.map((product, index) => (
          <ProductItem product={product} key={index} />
        ))}
      </ItemGroup>
    </div>
  )
}

const ProductItem = ({ product }: ProductItemProps) => {
  if (!product) return

  const { image, name, price, quantity } = product

  return (
    <Item role="listitem" className="p-2.5">
      <ItemMedia variant="image" className="size-20">
        <img src={image} alt={name} className="block size-full object-cover object-center" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
        <Price onSale={!!price.sale} className="text-xs">
          <PriceValue
            currency={price.currency}
            price={price.regular}
            className="text-muted-foreground"
          />
          <PriceValue
            currency={price.currency}
            price={price.sale}
            className="text-muted-foreground"
          />
        </Price>
        <div className="flex items-center gap-1 text-muted-foreground">
          <dt>Quantity</dt>
          <dd>{quantity}</dd>
        </div>
        <ItemDescription></ItemDescription>
      </ItemContent>
    </Item>
  )
}

const Summary = ({ summary }: SummaryProps) => {
  if (!summary) return

  const summaryItems = [summary.subtotal, summary.shipping, summary.tax, summary.total]

  const currency = summary.currency

  return (
    <div className="space-y-5 border-t">
      <ol className="pt-5">
        {summaryItems.map(({ value, label }, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-1 space-y-2 text-sm last:mt-4 last:border-t last:pt-4"
          >
            <dt>{label}</dt>
            <dd className="text-right font-semibold">
              {typeof value === 'number' ? (
                <Price>
                  <PriceValue currency={currency} price={value as number} />
                </Price>
              ) : (
                value
              )}
            </dd>
          </li>
        ))}
      </ol>
      <Button className="w-full">Checkout</Button>
    </div>
  )
}

export { Checkout10 }
