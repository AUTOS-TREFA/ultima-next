import { ArrowLeftIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { CardContent } from '@/components/ui/card'

import MultiStep02ReviewCompleteSVG from '@/assets/svg/multi-step-02-review-complete'
import type { StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-02/MultiStepForm'

const ReviewCompleteStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <div className='flex flex-col gap-4'>
          <p className='text-2xl font-semibold'>Almost done! 🚀</p>
          <p className='text-muted-foreground'>Confirm your deal details information and submit to create it.</p>
          <div className='text-muted-foreground flex flex-col gap-4'>
            <div className='flex items-center gap-3'>
              <p className='text-foreground w-30 font-medium'>Deal Type</p>
              <p>Percentage</p>
            </div>
            <div className='flex items-center gap-3'>
              <p className='text-foreground w-30 font-medium'>Amount</p>
              <p>25%</p>
            </div>
            <div className='flex items-center gap-3'>
              <p className='text-foreground w-30 font-medium'>Deal Code</p>
              <p>BLACKFRIDAY25</p>
            </div>
            <div className='flex items-center gap-3'>
              <p className='text-foreground w-30 font-medium'>Deal Title</p>
              <p>Black Friday Sale, 25% off</p>
            </div>
            <div className='flex items-center gap-3'>
              <p className='text-foreground w-30 font-medium'>Deal Duration</p>
              <p>2025-07-14 to 2025-07-28</p>
            </div>
            <div className='flex items-center gap-2'>
              <Switch id='confirm-deal-details' />
              <Label htmlFor='confirm-deal-details' className='text-foreground'>
                I have confirmed the deal details
              </Label>
            </div>
          </div>
        </div>
        <div className='flex items-center justify-center'>
          <MultiStep02ReviewCompleteSVG className='opacity-70' />
        </div>
      </div>
      <div className='flex justify-between gap-4'>
        <Button variant='secondary' size='lg' onClick={stepper.prev}>
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button
          size='lg'
          onClick={stepper.next}
          className='bg-green-600 text-white hover:bg-green-600/90 focus-visible:ring-green-600/20 dark:bg-green-400/60 dark:hover:bg-green-400/50 dark:focus-visible:ring-green-400/40'
        >
          Submit
        </Button>
      </div>
    </CardContent>
  )
}

export default ReviewCompleteStep
