'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClockFading, Heart, ShoppingBag } from 'lucide-react'
import { Fragment } from 'react'
import type { ControllerRenderProps, UseFormReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import z from 'zod'
import { cn } from '@/lib/utils'

import { Price, PriceValue } from '@/components/shadcnblocks/price'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { Field, FieldLegend, FieldLabel } from '@/components/ui/field'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
const STOCK_STATUS = {
  IN_STOCK: 'IN_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  LOW_STOCK: 'LOW_STOCK'
} as const

type StockStatusCode = keyof typeof STOCK_STATUS

type option = {
  id: string
  label: string
  value: string
  stockStatusCode: StockStatusCode
}

type FormType = z.infer<typeof formSchema>

type FieldName = keyof FormType

interface ProductPrice {
  regular: number
  sale?: number
  discountPercent?: string
  currency: string
}

interface ProductFormProps {
  sizeHinges?: {
    name: FieldName
    label: string
    options: Array<option>
  }
}

interface SizeRadioGroupProps {
  options: Array<option>
  field: ControllerRenderProps<FormType>
  form: UseFormReturn<FormType>
  onSubmit: (values: FormType) => void
}

type SizeOptionProps = option

interface Product {
  name: string
  link: string
  image: {
    src: string
    alt: string
  }
  price: ProductPrice
  sizeHinges: {
    name: FieldName
    label: string
    options: Array<option>
  }
}

const PRODUCT_CARD: Product = {
  name: 'Illustrated Sweatshirt',
  link: '#',
  image: {
    src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/ecommerce/clothes/dynamic-sketches-sports-illustrated-sweatshirt.png',
    alt: ''
  },
  price: {
    regular: 59.0,
    sale: 49.0,
    discountPercent: '-30%',
    currency: 'USD'
  },
  sizeHinges: {
    name: 'size',
    label: 'Select size',
    options: [
      {
        id: 'xs-1',
        label: 'xs',
        value: 'xs',
        stockStatusCode: 'OUT_OF_STOCK'
      },
      {
        id: 's-1',
        label: 's',
        value: 's',
        stockStatusCode: 'OUT_OF_STOCK'
      },
      {
        id: 'm-1',
        label: 'm',
        value: 'm',
        stockStatusCode: 'IN_STOCK'
      },
      {
        id: 'l-1',
        label: 'l',
        value: 'l',
        stockStatusCode: 'LOW_STOCK'
      },
      {
        id: 'xl-1',
        label: 'xl',
        value: 'xl',
        stockStatusCode: 'LOW_STOCK'
      }
    ]
  }
}

interface ProductCard7Props {
  className?: string
}

const ProductCard7 = ({ className }: ProductCard7Props) => {
  const { regular, sale, currency } = PRODUCT_CARD.price

  return (
    <Card className={cn('max-w-90 border-none bg-background p-0 shadow-none', className)}>
      <CardContent className="p-0">
        <div className="group relative">
          <a href={PRODUCT_CARD.link}>
            <AspectRatio ratio={0.78125} className="overflow-hidden">
              <img
                src={PRODUCT_CARD.image.src}
                alt={PRODUCT_CARD.image.alt}
                className="block size-full object-cover object-center"
              />
            </AspectRatio>
          </a>
          <div className="absolute inset-x-0 bottom-0 hidden border bg-background p-3 opacity-0 group-hover:opacity-100 lg:block">
            <ProductDesktopForm sizeHinges={PRODUCT_CARD.sizeHinges} />
          </div>
        </div>
        <div className="flex items-start justify-between gap-2 px-2 pt-2">
          <a href={PRODUCT_CARD.link} className="flex flex-1 flex-col gap-1">
            <CardTitle className="text-xs font-normal">{PRODUCT_CARD.name}</CardTitle>
            <Price onSale={sale != null} className="flex-col items-start gap-1 text-xs">
              <div className="flex items-center gap-1">
                <PriceValue
                  currency={currency}
                  price={sale}
                  variant="sale"
                  className="font-semibold text-red-600"
                />
                {PRODUCT_CARD.price.discountPercent && (
                  <Badge className="bg-red-600 px-1.5 py-px">
                    {PRODUCT_CARD.price.discountPercent}
                  </Badge>
                )}
              </div>
              <PriceValue price={regular} currency={currency} variant="regular" />
            </Price>
          </a>
          <Button variant="ghost" size="icon" className="hidden rounded-full lg:flex">
            <Heart />
          </Button>
          <div className="lg:hidden">
            <ProductMobileForm sizeHinges={PRODUCT_CARD.sizeHinges} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const formSchema = z.object({
  size: z.string().optional()
})

const ProductDesktopForm = ({ sizeHinges }: ProductFormProps) => {
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: sizeHinges ? { size: '' } : {}
  })

  function onSubmit(values: FormType) {
    console.log(values)
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col-reverse gap-11 lg:flex-col lg:gap-6"
    >
      {sizeHinges && (
        <Controller
          control={form.control}
          name={`${sizeHinges.name}`}
          render={({ field }) => (
            <Field className="gap-3">
              <FieldLegend className="justify-center text-center text-xs leading-normal">
                {sizeHinges.label}
              </FieldLegend>
              <SizeRadioGroup
                form={form}
                onSubmit={onSubmit}
                field={field}
                options={sizeHinges.options}
              />
            </Field>
          )}
        />
      )}

      {!sizeHinges && (
        <Button variant="ghost" className="text-xs uppercase">
          Add to Cart
        </Button>
      )}
    </form>
  )
}

const ProductMobileForm = ({ sizeHinges }: ProductFormProps) => {
  const form = useForm<FormType>({
    resolver: zodResolver(formSchema),
    defaultValues: sizeHinges ? { size: '' } : {}
  })

  function onSubmit(values: FormType) {
    console.log(values)
  }

  if (!sizeHinges) {
    return (
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col-reverse gap-11 lg:flex-col lg:gap-6"
      >
        <Button variant="ghost" size="icon" className="rounded-full">
          <ShoppingBag />
        </Button>
      </form>
    )
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <ShoppingBag />
        </Button>
      </DrawerTrigger>
      <DrawerContent aria-describedby={undefined}>
        <DrawerHeader className="px-5">
          <DrawerTitle className="text-sm">Add to Cart</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col-reverse gap-11 lg:flex-col lg:gap-6"
          >
            {sizeHinges && (
              <Controller
                control={form.control}
                name={`${sizeHinges.name}`}
                render={({ field }) => (
                  <Field className="gap-3">
                    <FieldLegend className="hidden justify-center text-center text-xs leading-normal lg:block">
                      {sizeHinges.label}
                    </FieldLegend>
                    <SizeRadioGroup
                      field={field}
                      options={sizeHinges.options}
                      form={form}
                      onSubmit={onSubmit}
                    />
                  </Field>
                )}
              />
            )}
            {!sizeHinges && (
              <Button variant="ghost" className="text-xs uppercase">
                Add to Cart
              </Button>
            )}
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

const SizeRadioGroup = ({ options, field, form, onSubmit }: SizeRadioGroupProps) => {
  if (!options) return

  const handleOnChange = async (value: string) => {
    if (form.formState.isSubmitting) return

    if (value !== field.value && value) {
      field.onChange(value)

      const valid = await form.trigger(field.name)
      if (valid) {
        await form.handleSubmit(onSubmit)()
      }
    }
  }

  return (
    <RadioGroup
      {...field}
      value={`${field.value}`}
      onValueChange={handleOnChange}
      className="flex w-full flex-col justify-center gap-0 lg:flex-row lg:flex-wrap lg:gap-3"
    >
      {options &&
        options.map((item, index) => (
          <Fragment key={`product-list-7-size-input-${index}`}>
            <div className="hidden lg:contents">
              <SizeOptionDesktop
                stockStatusCode={item.stockStatusCode}
                id={item.id}
                label={item.label}
                value={item.value}
              />
            </div>
            <div className="contents lg:hidden">
              <SizeOptionMobile
                stockStatusCode={item.stockStatusCode}
                id={`${item.id}-mobile`}
                label={item.label}
                value={item.value}
              />
            </div>
          </Fragment>
        ))}
    </RadioGroup>
  )
}

const SizeOptionDesktop = ({ id, label, value, stockStatusCode }: SizeOptionProps) => {
  if (stockStatusCode === STOCK_STATUS.IN_STOCK) {
    return (
      <Field>
        <FieldLabel
          htmlFor={id}
          className="flex h-8 min-w-8 cursor-pointer overflow-hidden rounded-full px-1.5 text-xs leading-none font-normal uppercase hover:ring has-checked:bg-primary has-checked:text-primary-foreground"
        >
          <RadioGroupItem
            id={id}
            className="sr-only"
            value={value}
            aria-label={`Select ${label}`}
          />
          <div className="m-auto">{label}</div>
        </FieldLabel>
      </Field>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Field>
              <FieldLabel
                htmlFor={id}
                className="group/size flex h-8 min-w-8 cursor-pointer overflow-hidden rounded-full px-1.5 text-xs leading-none font-normal uppercase not-has-disabled:hover:ring has-checked:bg-primary has-checked:text-primary-foreground has-disabled:bg-muted has-disabled:text-muted-foreground"
              >
                <RadioGroupItem
                  id={id}
                  className="sr-only"
                  value={value}
                  aria-label={`Select ${label}`}
                  disabled={stockStatusCode === STOCK_STATUS.OUT_OF_STOCK}
                />
                <div className="m-auto flex items-center justify-center gap-1.5">
                  {stockStatusCode === STOCK_STATUS.LOW_STOCK && (
                    <ClockFading className="size-4 stroke-muted-foreground group-has-checked/size:stroke-primary-foreground" />
                  )}
                  {label}
                </div>
              </FieldLabel>
            </Field>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-background px-5 shadow [&>span:nth-child(2)>svg]:bg-background [&>span:nth-child(2)>svg]:fill-background"
        >
          <span className="text-center text-xs text-muted-foreground">
            {stockStatusCode === STOCK_STATUS.LOW_STOCK ? 'Only a few left' : 'Out of stock'}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const SizeOptionMobile = ({ id, label, value, stockStatusCode }: SizeOptionProps) => {
  return (
    <Field>
      <FieldLabel
        htmlFor={id}
        className="px-5 pt-5 text-sm leading-normal font-normal uppercase not-has-disabled:active:bg-muted has-disabled:text-muted-foreground"
      >
        <RadioGroupItem
          id={id}
          className="sr-only"
          value={value}
          aria-label={`Select ${label}`}
          disabled={stockStatusCode === STOCK_STATUS.OUT_OF_STOCK}
        />
        <div className="flex w-full items-center justify-between gap-2 border-b pb-5">
          {label}
          <span className="text-center text-xs text-muted-foreground normal-case">
            {stockStatusCode === STOCK_STATUS.LOW_STOCK && 'Only a few left!'}
          </span>
        </div>
      </FieldLabel>
    </Field>
  )
}

export { ProductCard7 }
