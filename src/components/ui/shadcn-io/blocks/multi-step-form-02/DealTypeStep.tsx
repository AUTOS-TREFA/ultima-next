import { ArrowLeftIcon, ArrowRightIcon, DollarSignIcon, TagIcon, UserIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import MultiStep02DealTypeSVG from '@/assets/svg/multi-step-02-deal-type'
import type { StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-02/MultiStepForm'

const DealTypeStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <div className='flex justify-center rounded-lg border'>
        <MultiStep02DealTypeSVG className='opacity-80' />
      </div>
      <RadioGroup className='justify-items-center gap-6 sm:grid-cols-3 md:max-lg:grid-cols-1' defaultValue='percentage'>
        <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-md border p-4 shadow-xs outline-none'>
          <RadioGroupItem
            value='percentage'
            id='deal-type-percentage'
            className='order-1 size-5 after:absolute after:inset-0 [&_svg]:size-3'
            aria-describedby='percentage-description'
            aria-label='plan-radio-percentage'
          />
          <div className='grid grow justify-items-center gap-3'>
            <TagIcon className='size-8.5 stroke-1' />
            <div className='flex flex-col items-center text-center'>
              <p className='font-medium'>Percentage</p>
              <p id='percentage-description' className='text-muted-foreground text-sm'>
                Create a deal which offer uses some % off (i.e 5% OFF) on total
              </p>
            </div>
          </div>
        </div>
        <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-md border p-4 shadow-xs outline-none'>
          <RadioGroupItem
            value='flat-amount'
            id='deal-type-flat-amount'
            className='order-1 size-5 after:absolute after:inset-0 [&_svg]:size-3'
            aria-describedby='flat-amount-description'
            aria-label='plan-radio-flat-amount'
          />
          <div className='grid grow justify-items-center gap-3'>
            <DollarSignIcon className='size-8.5 stroke-1' />
            <div className='flex flex-col items-center text-center'>
              <p className='font-medium'>Flat Amount</p>
              <p id='flat-amount-description' className='text-muted-foreground text-sm'>
                Create a deal which offer uses flat $5 OFF on the total.
              </p>
            </div>
          </div>
        </div>
        <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full flex-col items-center gap-3 rounded-md border p-4 shadow-xs outline-none'>
          <RadioGroupItem
            value='prime-member'
            id='deal-type-prime-member'
            className='order-1 size-5 after:absolute after:inset-0 [&_svg]:size-3'
            aria-describedby='prime-member-description'
            aria-label='plan-radio-prime-member'
          />
          <div className='grid grow justify-items-center gap-3'>
            <UserIcon className='size-8.5 stroke-1' />
            <div className='flex flex-col items-center text-center'>
              <p className='font-medium'>Prime Member</p>
              <p id='prime-member-description' className='text-muted-foreground text-sm'>
                Create prime member only deal to encourage the members
              </p>
            </div>
          </div>
        </div>
      </RadioGroup>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-type-discount'>Discount</Label>
          <Input id='multi-step-deal-type-discount' type='number' placeholder='25' />
          <p className='text-muted-foreground/80 text-xs'>Enter the discount percentage. 10 = 10%</p>
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-type-region'>Region</Label>
          <Select>
            <SelectTrigger id='multi-step-deal-type-region' className='w-full'>
              <SelectValue placeholder='Select Region' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='north-america'>North America</SelectItem>
              <SelectItem value='europe'>Europe</SelectItem>
              <SelectItem value='asia-pacific'>Asia Pacific</SelectItem>
              <SelectItem value='south-america'>South America</SelectItem>
              <SelectItem value='africa'>Africa</SelectItem>
              <SelectItem value='middle-east'>Middle East</SelectItem>
            </SelectContent>
          </Select>
          <p className='text-muted-foreground/80 text-xs'>Select application region for the deal.</p>
        </div>
      </div>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' size='lg' onClick={stepper.prev} disabled={stepper.isFirst}>
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

export default DealTypeStep
