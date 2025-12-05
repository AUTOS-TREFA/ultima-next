import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'

import type { StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-02/MultiStepForm'

const CompleteStep = ({ stepper }: { stepper: StepperType }) => {
  return (
    <CardContent className='col-span-5 flex flex-col gap-6 p-6 md:col-span-3'>
      <div className='flex flex-col items-start'>
        <h2 className='text-2xl font-semibold'>Form Submitted</h2>
        <p className='text-muted-foreground'>Thank you for your submission!</p>
      </div>
      <div className='flex justify-end'>
        <Button size='lg' onClick={stepper.reset}>
          Reset
        </Button>
      </div>
    </CardContent>
  )
}

export default CompleteStep
