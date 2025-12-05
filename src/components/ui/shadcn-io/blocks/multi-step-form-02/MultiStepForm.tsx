'use client'

import * as Stepperize from '@stepperize/react'
import { CheckCircleIcon, CreditCardIcon, FileTextIcon, RocketIcon, TagIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

import DealTypeStep from '@/components/shadcn-studio/blocks/multi-step-form-02/DealTypeStep'
import DealDetailsStep from '@/components/shadcn-studio/blocks/multi-step-form-02/DealDetailsStep'
import DealUsageStep from '@/components/shadcn-studio/blocks/multi-step-form-02/DealUsageStep'
import ReviewCompleteStep from '@/components/shadcn-studio/blocks/multi-step-form-02/ReviewCompleteStep'
import CompleteStep from '@/components/shadcn-studio/blocks/multi-step-form-02/CompleteStep'

const { useStepper, utils } = Stepperize.defineStepper(
  { id: 'multi-step-2-deal-type', title: 'Deal Type', description: 'Choose type of deal', icon: TagIcon },
  { id: 'multi-step-2-deal-details', title: 'Deal Details', description: 'Provide deal details', icon: FileTextIcon },
  { id: 'multi-step-2-deal-usage', title: 'Deal Usage', description: 'Limitations & Offers', icon: CreditCardIcon },
  { id: 'multi-step-2-review-complete', title: 'Review & Complete', description: 'Launch a deal!', icon: RocketIcon },
  { id: 'multi-step-2-complete', title: 'Submitted', description: 'Form Submitted', icon: CheckCircleIcon }
)

export type StepperType = ReturnType<typeof useStepper>

const MultiStepForm = () => {
  const stepper = useStepper()
  const currentStep = utils.getIndex(stepper.current.id)

  return (
    <Card className='gap-0 p-0 md:grid md:max-lg:grid-cols-5 lg:grid-cols-4'>
      <CardContent className='col-span-5 p-6 max-md:border-b md:border-r md:max-lg:col-span-2 lg:col-span-1'>
        <nav aria-label='Multi Steps'>
          <ol className='flex flex-col justify-between gap-x-2 gap-y-4'>
            {stepper.all
              .filter(step => step.id !== 'multi-step-2-complete')
              .map((step, index) => (
                <li key={step.id}>
                  <Button
                    variant='ghost'
                    className='h-auto w-full shrink-0 cursor-pointer justify-start gap-2 rounded !bg-transparent p-0'
                    onClick={() => stepper.goTo(step.id)}
                  >
                    <Avatar className='size-9.5'>
                      <AvatarFallback
                        className={cn({ 'bg-primary text-primary-foreground shadow-sm': index <= currentStep })}
                      >
                        <step.icon className='size-4' />
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col items-start'>
                      <span>{step.title}</span>
                      <span className='text-muted-foreground text-sm'>{step.description}</span>
                    </div>
                  </Button>
                </li>
              ))}
          </ol>
        </nav>
      </CardContent>
      {stepper.switch({
        'multi-step-2-deal-type': () => <DealTypeStep stepper={stepper} />,
        'multi-step-2-deal-details': () => <DealDetailsStep stepper={stepper} />,
        'multi-step-2-deal-usage': () => <DealUsageStep stepper={stepper} />,
        'multi-step-2-review-complete': () => <ReviewCompleteStep stepper={stepper} />,
        'multi-step-2-complete': () => <CompleteStep stepper={stepper} />
      })}
    </Card>
  )
}

export default MultiStepForm
