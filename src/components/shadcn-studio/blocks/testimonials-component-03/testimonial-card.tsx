import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Rating } from '@/components/ui/rating'

type Testimonial = {
  name: string
  handle: string
  avatar: string
  rating: number
  title: string
  content: string
  platformName: string
  platformImage: string
}

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <Card className='break-inside-avoid-column border-none shadow-none'>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {/* Ratings */}
          <Rating readOnly variant='yellow' size={24} value={testimonial.rating} precision={0.5} />

          {/* Platform Details */}
          <div className='flex gap-1.5'>
            <img src={testimonial.platformImage} alt={testimonial.platformName} className='size-5.5' />
            <span className='text-sm'>{testimonial.platformName}</span>
          </div>
        </div>

        {/* Testimonial Content */}
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold'>{testimonial.title}</h3>
          <p className='text-muted-foreground'>{testimonial.content}</p>
        </div>

        {/* User Details */}
        <div className='flex items-center gap-3'>
          <Avatar className='size-12'>
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
            <AvatarFallback className='text-sm'>
              {testimonial.name
                .split(' ', 2)
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-0.5'>
            <h4 className='font-medium'>{testimonial.name}</h4>
            <p className='text-muted-foreground text-sm'>{testimonial.handle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TestimonialCard
