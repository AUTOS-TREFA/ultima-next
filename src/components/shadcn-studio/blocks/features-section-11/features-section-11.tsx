import type { ComponentType } from 'react'

import { MotionPreset } from '@/components/ui/motion-preset'

interface FeaturesProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}

const Features = ({ leftSection, rightSection }: { rightSection: FeaturesProps[]; leftSection: FeaturesProps[] }) => {
  return (
    <section className='py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:gap-16 sm:px-6 lg:gap-24 lg:px-8'>
        {/* Header */}
        <div className='space-y-4 text-center'>
          <MotionPreset
            component='h2'
            className='text-2xl font-semibold md:text-3xl lg:text-4xl'
            fade
            slide={{ direction: 'up', offset: 50 }}
            blur
            transition={{ duration: 0.5 }}
          >
            Quickly build, share, and{' '}
            <span className='relative z-10'>
              launch your perfect SaaS
              <span
                className='bg-primary absolute bottom-0 left-0 -z-10 h-px w-full max-sm:hidden'
                aria-hidden='true'
              />
            </span>{' '}
            solution!
          </MotionPreset>
          <MotionPreset
            component='p'
            className='text-muted-foreground text-xl'
            fade
            slide={{ direction: 'up', offset: 50 }}
            blur
            delay={0.3}
            transition={{ duration: 0.5 }}
          >
            Using technology to make finance simpler, smarter and more rewarding.
          </MotionPreset>
        </div>
        {/* Content */}
        <div className='grid grid-cols-1 items-center gap-16 max-md:gap-9 md:grid-cols-2 lg:grid-cols-3'>
          <div className='max-md:rotatat w-full space-y-9 max-lg:order-2 max-lg:mx-auto max-lg:max-w-100'>
            {leftSection.map((items, index) => {
              const IconComponent = items.icon

              return (
                <MotionPreset
                  component='div'
                  key={items.title}
                  className='flex items-center gap-4 max-lg:justify-end'
                  fade
                  slide={{ direction: 'down', offset: 50 }}
                  blur
                  delay={0.4 * index + 1.5}
                  transition={{ duration: 0.5 }}
                >
                  <div className='border-primary/60 dark:border-primary bg-primary/2 flex size-16 shrink-0 items-center justify-center rounded-md border lg:hidden'>
                    <IconComponent className='size-8 stroke-[1.5]' />
                  </div>
                  <div className='space-y-2 lg:text-right'>
                    <h4 className='text-lg font-semibold text-nowrap'>{items.title}</h4>
                    <p className='text-muted-foreground text-sm'>{items.description}</p>
                  </div>
                  <div className='border-primary/60 dark:border-primary bg-primary/2 flex size-16 shrink-0 items-center justify-center rounded-md border max-lg:hidden'>
                    <IconComponent className='size-8 stroke-[1.5]' />
                  </div>
                </MotionPreset>
              )
            })}
          </div>
          <MotionPreset
            component='div'
            className='max-lg:order-1 md:max-lg:col-span-2'
            fade
            blur
            delay={0.6}
            transition={{ duration: 0.9 }}
          >
            <img
              src='https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/features/image-26.png'
              alt='Phoneimage'
              className='mx-auto size-110 object-contain md:h-167.5 md:w-83'
            />
          </MotionPreset>
          <div className='w-full space-y-9 max-lg:order-3 max-lg:mx-auto max-lg:max-w-100'>
            {rightSection.map((items, index) => {
              const IconComponent = items.icon
              const leftSectionDelay = 0.4 * (leftSection.length - 1) + 1.5 + 0.5

              return (
                <MotionPreset
                  component='div'
                  key={items.title}
                  className='flex items-center gap-4'
                  fade
                  slide={{ direction: 'down', offset: 50 }}
                  blur
                  delay={leftSectionDelay + 0.4 * index}
                  transition={{ duration: 0.5 }}
                >
                  <div className='border-primary/60 dark:border-primary bg-primary/2 flex size-16 shrink-0 items-center justify-center rounded-md border'>
                    <IconComponent className='size-8 stroke-[1.5]' />
                  </div>
                  <div className='space-y-2'>
                    <h4 className='text-lg font-semibold'>{items.title}</h4>
                    <p className='text-muted-foreground text-sm'>{items.description}</p>
                  </div>
                </MotionPreset>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Features
