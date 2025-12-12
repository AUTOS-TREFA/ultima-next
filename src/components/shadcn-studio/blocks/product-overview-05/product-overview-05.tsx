'use client'

import { useId, useState } from 'react'

import {
  HeartIcon,
  PlusIcon,
  MinusIcon,
  StarIcon,
  BadgePercentIcon,
  ChevronRightIcon,
  CircleAlertIcon
} from 'lucide-react'

import { Button as AriaButton, Group, Input as AriaInput, NumberField } from 'react-aria-components'

import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

type ProductOverviewProps = {
  productItems: {
    name: string
    inStock: boolean
    stock: number
    totalReview: number
    itemSold: number
    rating: number
    description: string
    price: number
    discountPercentage?: number
    hasDiscount?: boolean
    image1: string
    alt1: string
    image2: string
    alt2: string
    image3: string
    alt3: string
    offers: Array<{
      title: string
      context: string
      numberOfOffer: number
      href: string
    }>
    defaultSize: string
    defaultColorOption: string
  }[]
  sizesChart: {
    value: string
    label: string
    disabled?: boolean
  }[]
  colorsChart: {
    value: string
    colorOption: string
    disabled?: boolean
  }[]
}

const ProductOverview = ({ productItems, colorsChart, sizesChart }: ProductOverviewProps) => {
  const id = useId()

  const [quantity, setQuantity] = useState(1)

  return (
    <section className='py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {productItems.map(item => {
          // Calculate prices per item
          const originalPrice = item.price
          const discountPercentage = item.discountPercentage || 0
          const hasDiscount = item.hasDiscount && discountPercentage > 0

          const finalPrice = hasDiscount ? originalPrice - (originalPrice * discountPercentage) / 100 : originalPrice

          const totalPrice = finalPrice * quantity

          return (
            <div key={item.name}>
              <div className='mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                <div className='flex items-center justify-center overflow-hidden rounded-xl lg:col-span-2'>
                  <img src={item.image1} alt={item.alt1} />
                </div>
                <div className='flex flex-col gap-6'>
                  <div className='flex h-max items-center justify-center overflow-hidden rounded-xl'>
                    <img src={item.image2} alt={item.alt2} />
                  </div>
                  <div className='flex h-max items-center justify-center overflow-hidden rounded-xl'>
                    <img src={item.image3} alt={item.alt3} />
                  </div>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                <div className='space-y-7 lg:col-span-2'>
                  <div className='space-y-4'>
                    <div className='flex items-center gap-6'>
                      <h2 className='grow text-2xl font-medium'>{item.name}</h2>
                      <Badge className='px-1.5 py-0.5' variant='secondary'>
                        Best seller
                      </Badge>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge className='gap-1.5 rounded-sm border-none bg-amber-600 px-3 py-1.25 text-white dark:bg-amber-700'>
                        <StarIcon className='stroke mb-0.5 size-3 fill-transparent stroke-white' />
                        {item.rating}
                      </Badge>
                      <p className='text-muted-foreground font-medium'>{item.totalReview} Reviews</p>
                      <p className='text-muted-foreground text-sm'>{item.itemSold} sold</p>
                      {item.inStock ? (
                        <p className='border-s ps-2 text-sm text-green-500'>{item.stock} In Stock</p>
                      ) : (
                        <p className='text-destructive border-s ps-2 text-sm'>Out of Stock</p>
                      )}
                    </div>
                  </div>
                  <p className='text-muted-foreground'>{item.description}</p>
                  {/* Price */}
                  {!hasDiscount ? (
                    <h4 className='text-3xl font-medium'>${finalPrice.toFixed(2)}</h4>
                  ) : (
                    <div className='flex items-center gap-3'>
                      <h4 className='text-3xl font-medium'>${finalPrice.toFixed(2)}</h4>
                      <span className='text-muted-foreground line-through'>MRP ${originalPrice.toFixed(2)}</span>
                      <Badge className='border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
                        {discountPercentage}% Off
                      </Badge>
                    </div>
                  )}
                  <div className='space-y-4'>
                    <h4 className='flex items-center gap-2 text-lg font-medium'>
                      <BadgePercentIcon className='text-destructive size-6.5' />
                      Offers
                    </h4>
                    <div className='grid items-center gap-7 lg:grid-cols-3'>
                      {item.offers.map(offerItem => (
                        <div key={offerItem.title} className='space-y-1 rounded-xl border px-6 py-4'>
                          <h4 className='font-semibold'>{offerItem.title}</h4>
                          <p className='text-muted-foreground line-clamp-2 text-sm'>{offerItem.context}</p>
                          <a href={offerItem.href} className='group flex items-center gap-1'>
                            {offerItem.numberOfOffer} Offer{' '}
                            <ChevronRightIcon className='transition-translate size-4.5 duration-300 group-hover:translate-x-1' />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='h-max space-y-7 rounded-md border p-6'>
                  {/* Color Selection */}
                  <div className='flex flex-col gap-4'>
                    <h4 className='text-lg font-medium'>More Color :</h4>
                    <RadioGroup className='flex' defaultValue={item.defaultColorOption}>
                      {colorsChart.map(colorItem => (
                        <label
                          key={`${id}-${colorItem.value}`}
                          className={cn(
                            `has-focus-visible:ring-ring/50 has-data-disabled:opacity-50' relative size-5 rounded-full text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed`,
                            colorItem.colorOption
                          )}
                        >
                          <RadioGroupItem
                            id={`${id}-${colorItem.value}`}
                            value={colorItem.value}
                            className='sr-only after:absolute after:inset-0'
                            aria-label={`color-radio-${colorItem.value}`}
                            disabled={colorItem.disabled}
                          />
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                  {/* Size Selection */}
                  <div className='flex flex-col gap-4'>
                    <h4 className='text-lg font-semibold'>Size :</h4>
                    <RadioGroup className='flex' defaultValue={item.defaultSize}>
                      {sizesChart.map(sizeItem => (
                        <label
                          key={`${id}-${sizeItem.value}`}
                          className='border-input group has-data-[state=checked]:bg-primary has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative flex flex-col items-center gap-3 rounded-md border px-3 py-1.5 text-center shadow-xs transition-[color,box-shadow] outline-none has-focus-visible:ring-[3px] has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50'
                        >
                          <RadioGroupItem
                            id={`${id}-${sizeItem.value}`}
                            value={sizeItem.value}
                            className='sr-only after:absolute after:inset-0'
                            aria-label={`size-radio-${sizeItem.value}`}
                            disabled={sizeItem.disabled}
                          />
                          <p className='text-foreground group-has-data-[state=checked]:text-primary-foreground text-sm leading-none font-medium'>
                            {sizeItem.label} mm
                          </p>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className='flex items-center gap-4'>
                    <h4 className='grow text-2xl font-semibold'>${totalPrice.toFixed(2)}</h4>
                    <NumberField
                      className='w-full grow space-y-2 sm:max-w-36'
                      value={quantity}
                      onChange={setQuantity}
                      minValue={1}
                      formatOptions={{
                        useGrouping: false
                      }}
                    >
                      <Group className='dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 grow items-center overflow-hidden rounded-md border bg-transparent text-base whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px] md:text-sm'>
                        <AriaButton
                          slot='decrement'
                          className='bg-primary/10 text-muted-foreground hover:bg-accent hover:text-foreground ms-2 flex aspect-square h-5.5 items-center justify-center rounded-sm text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <MinusIcon className='size-3.5' />
                          <span className='sr-only'>Decrement</span>
                        </AriaButton>
                        <AriaInput className='selection:bg-primary selection:text-primary-foreground w-full grow px-3 py-2 text-center tabular-nums outline-none' />
                        <AriaButton
                          slot='increment'
                          className='bg-primary/10 text-muted-foreground hover:bg-accent hover:text-foreground me-2 flex aspect-square h-5.5 items-center justify-center rounded-sm text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
                        >
                          <PlusIcon className='size-3.5' />
                          <span className='sr-only'>Increment</span>
                        </AriaButton>
                      </Group>
                    </NumberField>
                  </div>
                  <Alert className='border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400'>
                    <CircleAlertIcon />
                    <AlertDescription className='text-amber-600/80 dark:text-amber-400/80'>
                      Order this product immediately, will soon run out and this stock will no longer be available
                    </AlertDescription>
                  </Alert>
                  <div className='flex flex-row gap-4'>
                    <Button className='grow'>Buy Now</Button>
                    <Button variant='outline' size='icon'>
                      <HeartIcon />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ProductOverview
