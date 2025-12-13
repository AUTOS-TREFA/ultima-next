import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { Marquee } from '@/components/ui/marquee'
import { MotionPreset } from '@/components/ui/motion-preset'

import TestimonialCard from '@/components/shadcn-studio/blocks/testimonials-component-03/testimonial-card'

export type HeroSlideItem = {
  description: string
  logo: string
  alt: string
}

export type TestimonialItem = {
  name: string
  handle: string
  avatar: string
  rating: number
  title: string
  content: string
  platformName: string
  platformImage: string
}

type TestimonialsComponentProps = {
  heroSlides: HeroSlideItem[]
  testimonials: TestimonialItem[]
}

const TestimonialsComponent = ({ heroSlides, testimonials }: TestimonialsComponentProps) => {
  return (
    <section className='bg-muted pt-8 sm:pt-16 lg:pt-24'>
      <div className='mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:space-y-24 lg:px-8'>
        {/* Hero Slides */}
        <div className='space-y-6 text-center sm:space-y-7.5 lg:space-y-9'>
          <MotionPreset
            component='h2'
            fade
            slide={{ direction: 'down' }}
            transition={{ duration: 0.5 }}
            className='text-primary z-1 inline-block text-3xl font-bold sm:text-4xl lg:text-5xl'
          >
            Nuestros clientes nos respaldan ⭐
          </MotionPreset>

          <MotionPreset fade slide={{ direction: 'down' }} delay={0.3} transition={{ duration: 0.5 }}>
            <Carousel className='flex w-full items-center gap-4' opts={{ align: 'start', loop: true }}>
              <CarouselPrevious
                variant='default'
                className='bg-primary/10 hover:bg-primary/20 text-primary static size-9 translate-y-0'
              />
              <CarouselContent>
                {heroSlides.map((slide, index) => (
                  <CarouselItem key={index} className='flex flex-col items-center gap-6'>
                    <p className='text-muted-foreground text-start text-base font-medium sm:text-center sm:text-2xl'>
                      {slide.description}
                    </p>
                    <img src={slide.logo} alt={slide.alt} className='h-8.5 w-auto' />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselNext
                variant='default'
                className='bg-primary/10 hover:bg-primary/20 text-primary static size-9 translate-y-0'
              />
            </Carousel>
          </MotionPreset>
        </div>

        {/* Testimonials Marquee */}
        <MotionPreset
          fade
          slide={{ direction: 'down' }}
          delay={0.6}
          transition={{ duration: 0.5 }}
          className='relative grid sm:grid-cols-2 lg:grid-cols-4'
        >
          <div className='from-muted absolute top-0 z-1 h-1/3 w-full bg-gradient-to-b to-transparent' />
          <Marquee vertical pauseOnHover delay={0.9} duration={20} gap={3} className='h-200'>
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <Marquee vertical pauseOnHover delay={0.9} duration={20} gap={3} reverse className='h-200 max-sm:hidden'>
            {testimonials.slice(3, 6).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <Marquee vertical pauseOnHover delay={0.9} duration={20} gap={3} className='h-200 max-lg:hidden'>
            {testimonials.slice(6, 9).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <Marquee vertical pauseOnHover delay={0.9} duration={20} gap={3} reverse className='h-200 max-lg:hidden'>
            {testimonials.slice(9, 12).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
        </MotionPreset>
      </div>
    </section>
  )
}

export default TestimonialsComponent
