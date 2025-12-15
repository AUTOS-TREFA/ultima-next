import { BriefcaseMedicalIcon, HospitalIcon, SearchIcon, UserIcon } from 'lucide-react'

import { MotionPreset } from '@/components/ui/motion-preset'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const HeroSection = () => {
  return (
    <section className='flex-1 overflow-hidden'>
      <div className='mx-auto flex h-full max-w-7xl flex-col gap-12 p-4 sm:p-6 lg:p-8'>
        <div className='relative grid gap-8 sm:gap-16 lg:grid-cols-2 lg:gap-24'>
          <div className='flex flex-col justify-center gap-5'>
            <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.1}>
              <Badge variant='outline' className='px-3 py-1'>
                24/7 Emergency Support
              </Badge>
            </MotionPreset>
            <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.3}>
              <h1 className='max-w-3xl text-3xl leading-[1.29167] font-bold sm:text-4xl lg:text-5xl'>
                Helping You Heal, Thrive & Live Better
              </h1>
            </MotionPreset>
            <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.5}>
              <p className='text-muted-foreground'>
                Your health deserves the best care. At our hospital, we bring together world-class doctors, modern
                technology, and compassionate service to offer you a seamless healthcare experience. Whether you need a
                specialist consultation, a diagnostic test, or ongoing treatment, booking your appointment is just a
                click away. Start your journey to better health with the right support, right when you need it.
              </p>
            </MotionPreset>
          </div>
          <div className='group relative flex h-full shrink-0 items-center justify-center overflow-hidden'>
            <MotionPreset
              component='div'
              fade
              zoom
              blur
              transition={{ duration: 0.5 }}
              delay={0.5}
              className='bg-primary shadow-inset absolute inset-x-0 bottom-0 h-1/2 w-full rounded-[36px] shadow-white'
            ></MotionPreset>
            <MotionPreset fade slide={{ direction: 'down', offset: 100 }} blur transition={{ duration: 0.9 }} delay={1}>
              <img
                src='https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/hero/image-54.png'
                alt='girl light'
                className='z-1 w-full transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105 max-lg:w-3/4 dark:hidden'
              />
              <img
                src='https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/hero/image-54-dark.png'
                alt='girl light'
                className='z-1 hidden w-full transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105 max-lg:w-3/4 dark:block'
              />
            </MotionPreset>
          </div>
        </div>
        <MotionPreset
          fade
          blur
          slide
          transition={{ duration: 0.5 }}
          delay={1}
          className='overflow-hidden rounded-md max-xl:grid md:grid-cols-2 xl:flex'
        >
          <div className='flex flex-1 items-center gap-6 border p-6 max-md:rounded-t-md md:max-xl:rounded-tl-md xl:rounded-l-md'>
            <Avatar className='size-11.5 rounded-md'>
              <AvatarFallback className='bg-primary/10 rounded-md'>
                <HospitalIcon className='text-primary size-7' />
              </AvatarFallback>
            </Avatar>
            <div className='relative w-full flex-1'>
              <Label htmlFor='hospital' className='text-muted-foreground absolute text-lg font-normal'>
                Hospital
              </Label>
              <Select defaultValue='rskm'>
                <SelectTrigger
                  id='hospital'
                  className='!text-primary [&_svg]:!text-primary !h-14 w-full border-none !bg-transparent p-0 pt-6 text-lg font-semibold shadow-none focus-visible:border-none focus-visible:ring-0 data-[size=default]:h-12 [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:right-0 [&_svg]:size-6.5 [&_svg]:-translate-y-1/2'
                >
                  <SelectValue placeholder='Select a hospital' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='rskm'>RSKM</SelectItem>
                    <SelectItem value='sunrise'>Sunrise Medical</SelectItem>
                    <SelectItem value='hopeValley'>Hope Valley</SelectItem>
                    <SelectItem value='grace'>Grace Memorial</SelectItem>
                    <SelectItem value='stMarys'>St. Mary’s</SelectItem>
                    <SelectItem value='greenwood'>RPMS Medical</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex flex-1 items-center gap-6 border p-6 md:max-xl:rounded-tr-md'>
            <Avatar className='size-11.5 rounded-md'>
              <AvatarFallback className='bg-primary/10 rounded-md'>
                <BriefcaseMedicalIcon className='text-primary size-7' />
              </AvatarFallback>
            </Avatar>
            <div className='relative w-full flex-1'>
              <Label htmlFor='specialist' className='text-muted-foreground absolute text-lg font-normal'>
                Specialist
              </Label>
              <Select defaultValue='cardiologist'>
                <SelectTrigger
                  id='specialist'
                  className='!text-primary [&_svg]:!text-primary !h-14 w-full border-none !bg-transparent p-0 pt-6 text-lg font-semibold shadow-none focus-visible:border-none focus-visible:ring-0 data-[size=default]:h-12 [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:right-0 [&_svg]:size-6.5 [&_svg]:-translate-y-1/2 [&_svg]:opacity-100'
                >
                  <SelectValue placeholder='Select a specialist' />
                </SelectTrigger>
                <SelectContent className='text-primary'>
                  <SelectGroup>
                    <SelectItem value='cardiologist'>Cardiologist</SelectItem>
                    <SelectItem value='neurologist'>Neurologist</SelectItem>
                    <SelectItem value='orthopedic'>Orthopedic</SelectItem>
                    <SelectItem value='pediatrician'>Pediatrician</SelectItem>
                    <SelectItem value='dermatologist'>Dermatologist</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex flex-1 items-center gap-6 border p-6 md:max-xl:rounded-bl-md'>
            <Avatar className='size-11.5 rounded-md'>
              <AvatarFallback className='bg-primary/10 rounded-md'>
                <UserIcon className='text-primary size-7' />
              </AvatarFallback>
            </Avatar>
            <div className='relative w-full flex-1'>
              <Label htmlFor='doctor' className='text-muted-foreground absolute text-lg font-normal'>
                Doctor
              </Label>
              <Select defaultValue='johnSmith'>
                <SelectTrigger
                  id='doctor'
                  className='!text-primary [&_svg]:!text-primary !h-14 w-full border-none !bg-transparent p-0 pt-6 text-lg font-semibold shadow-none focus-visible:border-none focus-visible:ring-0 data-[size=default]:h-12 [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:right-0 [&_svg]:size-6.5 [&_svg]:-translate-y-1/2'
                >
                  <SelectValue placeholder='Select a doctor' />
                </SelectTrigger>
                <SelectContent className='text-primary'>
                  <SelectGroup>
                    <SelectItem value='johnSmith'>Dr. John Smith</SelectItem>
                    <SelectItem value='sarahJohnson'>Dr. Sarah Johnson</SelectItem>
                    <SelectItem value='jamesLee'>Dr. James Lee</SelectItem>
                    <SelectItem value='emilyWhite'>Dr. Emily White</SelectItem>
                    <SelectItem value='michaelBrown'>Dr. Michael Brown</SelectItem>
                    <SelectItem value='oliviaDavis'>Dr. Olivia Davis</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='max-xl:flex-1 xl:w-44'>
            <Button className='group !h-full w-full rounded-none max-md:h-22'>
              <SearchIcon className='size-7.5 group-hover:scale-110' />
            </Button>
          </div>
        </MotionPreset>
      </div>
    </section>
  )
}

export default HeroSection
