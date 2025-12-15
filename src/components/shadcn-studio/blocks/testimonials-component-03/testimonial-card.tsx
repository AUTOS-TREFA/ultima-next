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
    <Card className='break-inside-avoid-column bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100/50'>
      <CardContent className='flex flex-col gap-5 p-6'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {/* Ratings */}
          <Rating readOnly variant='yellow' size={18} value={testimonial.rating} precision={0.5} />

          {/* Platform Details */}
          <div className='flex items-center gap-1.5'>
            <img src={testimonial.platformImage} alt={testimonial.platformName} className='w-5 h-5 object-contain' />
            <span className='text-sm text-slate-500'>{testimonial.platformName}</span>
          </div>
        </div>

        {/* Testimonial Content */}
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold text-slate-800'>{testimonial.title}</h3>
          <p className='text-slate-600'>{testimonial.content}</p>
        </div>

        {/* User Details */}
        <div className='flex items-center gap-3'>
          <Avatar className='w-12 h-12'>
            <AvatarImage src={testimonial.avatar} alt={testimonial.name} className='w-12 h-12 object-cover' />
            <AvatarFallback className='text-sm flex items-center justify-center w-full h-full'>
              {testimonial.name
                .split(' ', 2)
                .map(n => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-0.5'>
            <h4 className='font-medium text-slate-800'>{testimonial.name}</h4>
            <p className='text-slate-500 text-sm'>{testimonial.handle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TestimonialCard
