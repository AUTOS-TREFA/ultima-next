'use client'

import { useState } from 'react'

import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-02/MultiStepForm'

const DealDetailsStep = ({ stepper }: { stepper: StepperType }) => {
  const [range, setRange] = useState<DateRange | undefined>(undefined)

  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-details-title'>Deal Title</Label>
          <Input id='multi-step-deal-details-title' placeholder='Black Friday Sale, 25% Off' />
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-details-code'>Deal Code</Label>
          <Input id='multi-step-deal-details-code' placeholder='BLACKFRIDAY25' />
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-details-description'>Description</Label>
          <Textarea
            id='multi-step-deal-details-description'
            rows={4}
            placeholder='Enter deal description here...'
            className='h-full'
          />
        </div>
        <div className='flex flex-col gap-6 md:max-lg:col-span-2'>
          <div className='flex flex-col items-start gap-1'>
            <Label htmlFor='multi-step-deal-details-offered-items'>Offered Items</Label>
            <Select>
              <SelectTrigger id='multi-step-deal-details-offered-items' className='w-full'>
                <SelectValue placeholder='Select Offered Items' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='electronics'>Electronics</SelectItem>
                <SelectItem value='clothing'>Clothing</SelectItem>
                <SelectItem value='home-garden'>Home & Garden</SelectItem>
                <SelectItem value='books'>Books</SelectItem>
                <SelectItem value='sports-outdoors'>Sports & Outdoors</SelectItem>
                <SelectItem value='toys-games'>Toys & Games</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col items-start gap-1'>
            <Label htmlFor='multi-step-deal-details-card-condition'>Card Condition</Label>
            <Select>
              <SelectTrigger id='multi-step-deal-details-card-condition' className='w-full'>
                <SelectValue placeholder='Select Card Condition' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='new'>New</SelectItem>
                <SelectItem value='like-new'>Like New</SelectItem>
                <SelectItem value='good'>Good</SelectItem>
                <SelectItem value='fair'>Fair</SelectItem>
                <SelectItem value='poor'>Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-details-duration'>Deal Duration</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                id='multi-step-deal-details-duration'
                className='w-full justify-between font-normal'
              >
                {range?.from && range?.to
                  ? `${range.from.toLocaleDateString('en-CA')} to ${range.to.toLocaleDateString('en-CA')}`
                  : 'YYYY-MM-DD to YYYY-MM-DD'}
                <ChevronDownIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
              <Calendar
                mode='range'
                selected={range}
                onSelect={range => {
                  setRange(range)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label className='font-semibold'>Notify Users</Label>
          <div className='flex size-full flex-wrap items-center gap-x-6 gap-y-2'>
            {['Email', 'SMS', 'Push Notifications'].map(label => (
              <div key={label} className='flex items-center gap-2'>
                <Checkbox id={label} className='size-5' />
                <Label htmlFor={label}>{label}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' size='lg' onClick={stepper.prev}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button size='lg' onClick={stepper.next}>
          Next
          <ArrowRightIcon />
        </Button>
      </div>
    </CardContent>
  )
}

export default DealDetailsStep
