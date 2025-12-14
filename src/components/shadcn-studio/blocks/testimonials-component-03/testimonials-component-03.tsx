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
    <section className='bg-white py-12 sm:py-20 lg:py-28'>
      <div className='mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:space-y-20 lg:px-8'>
        {/* Hero Slides */}
        <div className='space-y-6 text-center sm:space-y-7.5 lg:space-y-9'>
          <MotionPreset
            component='h2'
            fade
            slide={{ direction: 'down' }}
            transition={{ duration: 0.5 }}
            className='text-primary z-1 inline-block text-2xl font-bold md:text-3xl lg:text-4xl'
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
                  <CarouselItem key={index} className='flex flex-col items-center gap-4'>
                    <p className='text-muted-foreground text-start text-sm font-medium sm:text-center sm:text-base lg:text-lg max-w-2xl'>
                      {slide.description}
                    </p>
                    <img src={slide.logo} alt={slide.alt} className='h-6 w-auto max-w-[100px] object-contain opacity-70' />
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
          className='relative grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        >
          {/* Top fade overlay - fade from white to transparent */}
          <div
            className='absolute top-0 z-10 h-56 w-full pointer-events-none'
            style={{ background: 'linear-gradient(to bottom, white 0%, rgba(255,255,255,0.8) 40%, transparent 100%)' }}
          />
          {/* Bottom fade overlay - fade from white to transparent */}
          <div
            className='absolute bottom-0 z-10 h-56 w-full pointer-events-none'
            style={{ background: 'linear-gradient(to top, white 0%, rgba(255,255,255,0.8) 40%, transparent 100%)' }}
          />

          <Marquee vertical pauseOnHover delay={0.9} duration={22} gap={4} className='h-[44rem]'>
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <Marquee vertical pauseOnHover delay={0.9} duration={25} gap={4} reverse className='h-[44rem] max-sm:hidden'>
            {testimonials.slice(3, 6).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <Marquee vertical pauseOnHover delay={0.9} duration={28} gap={4} className='h-[44rem] max-lg:hidden'>
            {testimonials.slice(6, 9).map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </Marquee>
          <Marquee vertical pauseOnHover delay={0.9} duration={24} gap={4} reverse className='h-[44rem] max-xl:hidden'>
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
