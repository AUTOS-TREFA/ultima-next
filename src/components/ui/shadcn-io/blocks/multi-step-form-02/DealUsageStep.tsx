import { ArrowLeftIcon, ArrowRightIcon, DollarSignIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-02/MultiStepForm'

const DealUsageStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-usage-user-type'>User Type</Label>
          <Select>
            <SelectTrigger id='multi-step-deal-usage-user-type' className='w-full'>
              <SelectValue placeholder='Select User Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='customer'>Customer</SelectItem>
              <SelectItem value='member'>Member</SelectItem>
              <SelectItem value='vip'>VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-usage-max-users'>Max Users</Label>
          <Input id='multi-step-deal-usage-max-users' type='number' placeholder='500' />
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-usage-min-cart-amount'>Minimum Cart Amount</Label>
          <div className='relative w-full'>
            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
              <DollarSignIcon className='size-4' />
              <span className='sr-only'>Dollar Sign</span>
            </div>
            <Input id='multi-step-deal-usage-min-cart-amount' type='number' placeholder='99' className='peer pl-9' />
          </div>
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-usage-promotional-fee'>Promotional Fee</Label>
          <div className='relative w-full'>
            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
              <DollarSignIcon className='size-4' />
              <span className='sr-only'>Dollar Sign</span>
            </div>
            <Input id='multi-step-deal-usage-promotional-fee' type='number' placeholder='9' className='peer pl-9' />
          </div>
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-usage-payment-method'>Payment Method</Label>
          <Select>
            <SelectTrigger id='multi-step-deal-usage-payment-method' className='w-full'>
              <SelectValue placeholder='Select Payment Method' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='credit-card'>Credit Card</SelectItem>
              <SelectItem value='debit-card'>Debit Card</SelectItem>
              <SelectItem value='paypal'>PayPal</SelectItem>
              <SelectItem value='bank-transfer'>Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col items-start gap-1 md:max-lg:col-span-2'>
          <Label htmlFor='multi-step-deal-usage-deal-status'>Deal Status</Label>
          <Select>
            <SelectTrigger id='multi-step-deal-usage-deal-status' className='w-full'>
              <SelectValue placeholder='Select Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='inactive'>Inactive</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='expired'>Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-2 sm:col-span-2'>
          <Switch id='limit-single-use' />
          <Label htmlFor='limit-single-use'>Limit this discount to a single-use per customer?</Label>
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

export default DealUsageStep
