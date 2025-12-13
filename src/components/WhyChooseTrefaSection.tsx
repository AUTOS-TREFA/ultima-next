'use client'

import type { ComponentType } from 'react'
import { MotionPreset } from '@/components/ui/motion-preset'
import { ShieldCheck, TrendingUp, Heart, Lock, MessageCircle, Users } from 'lucide-react'

interface FeatureItem {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}

const leftFeatures: FeatureItem[] = [
  {
    icon: ShieldCheck,
    title: "Garantía TREFA",
    description: "Cada auto pasa por una rigurosa inspección de 150 puntos. Si algo falla, nosotros respondemos."
  },
  {
    icon: TrendingUp,
    title: "Financiamiento 100% Digital",
    description: "Aplica desde tu celular y recibe respuesta en 24 horas. Trabajamos con los mejores bancos del país."
  },
  {
    icon: Users,
    title: "Más de 5,000 clientes satisfechos",
    description: "Somos la agencia de seminuevos mejor calificada en el noreste de México. Tu confianza nos respalda."
  },
]

const rightFeatures: FeatureItem[] = [
  {
    icon: Lock,
    title: "Kit de Seguridad TREFA",
    description: "Garantía blindada de $100,000 MXN, programa de recompra garantizada, y certificado de procedencia segura incluidos."
  },
  {
    icon: MessageCircle,
    title: "Asesoría personalizada",
    description: "Un asesor te acompaña en cada paso del proceso vía WhatsApp. Resolvemos todas tus dudas al instante."
  },
  {
    icon: Heart,
    title: "Tranquilidad absoluta",
    description: "No solicitamos pagos por adelantado. Paga tu enganche en sucursal después de conocer y manejar tu auto."
  },
]

const WhyChooseTrefaSection = () => {
  return (
    <section className='py-8 sm:py-16 lg:py-24 bg-gray-50'>
      <div className='mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:gap-16 sm:px-6 lg:gap-24 lg:px-8'>
        {/* Header */}
        <div className='space-y-4 text-center'>
          <MotionPreset
            component='h2'
            className='text-2xl font-bold md:text-3xl lg:text-4xl'
            fade
            slide={{ direction: 'up', offset: 50 }}
            blur
            transition={{ duration: 0.5 }}
          >
            ¿Por qué elegir{' '}
            <span className='relative z-10 text-[#FF6801]'>
              TREFA
              <span
                className='bg-[#FF6801] absolute bottom-0 left-0 -z-10 h-px w-full max-sm:hidden'
                aria-hidden='true'
              />
            </span>
            ?
          </MotionPreset>
          <MotionPreset
            component='p'
            className='text-muted-foreground text-lg lg:text-xl max-w-3xl mx-auto'
            fade
            slide={{ direction: 'up', offset: 50 }}
            blur
            delay={0.3}
            transition={{ duration: 0.5 }}
          >
            Simplificamos cada paso para que tu experiencia sea segura, transparente y excepcional.
          </MotionPreset>
        </div>

        {/* Content */}
        <div className='grid grid-cols-1 items-center gap-16 max-md:gap-9 md:grid-cols-2 lg:grid-cols-3'>
          {/* Left Features */}
          <div className='w-full space-y-9 max-lg:order-2 max-lg:mx-auto max-lg:max-w-md'>
            {leftFeatures.map((item, index) => {
              const IconComponent = item.icon

              return (
                <MotionPreset
                  component='div'
                  key={item.title}
                  className='flex items-center gap-4 max-lg:justify-end'
                  fade
                  slide={{ direction: 'down', offset: 50 }}
                  blur
                  delay={0.4 * index + 1.5}
                  transition={{ duration: 0.5 }}
                >
                  <div className='border-[#FF6801]/60 bg-[#FF6801]/10 flex size-16 shrink-0 items-center justify-center rounded-xl border lg:hidden'>
                    <IconComponent className='size-8 stroke-[1.5] text-[#FF6801]' />
                  </div>
                  <div className='space-y-2 lg:text-right'>
                    <h4 className='text-lg font-semibold'>{item.title}</h4>
                    <p className='text-muted-foreground text-sm'>{item.description}</p>
                  </div>
                  <div className='border-[#FF6801]/60 bg-[#FF6801]/10 flex size-16 shrink-0 items-center justify-center rounded-xl border max-lg:hidden'>
                    <IconComponent className='size-8 stroke-[1.5] text-[#FF6801]' />
                  </div>
                </MotionPreset>
              )
            })}
          </div>

          {/* Center Image */}
          <MotionPreset
            component='div'
            className='max-lg:order-1 md:max-lg:col-span-2'
            fade
            blur
            delay={0.6}
            transition={{ duration: 0.9 }}
          >
            <img
              src='/images/landing-asset-main.png'
              alt='Asesor TREFA'
              className='mx-auto h-auto w-full max-w-md object-contain md:max-w-lg lg:max-w-xl xl:max-w-2xl'
            />
          </MotionPreset>

          {/* Right Features */}
          <div className='w-full space-y-9 max-lg:order-3 max-lg:mx-auto max-lg:max-w-md'>
            {rightFeatures.map((item, index) => {
              const IconComponent = item.icon
              const leftSectionDelay = 0.4 * (leftFeatures.length - 1) + 1.5 + 0.5

              return (
                <MotionPreset
                  component='div'
                  key={item.title}
                  className='flex items-center gap-4'
                  fade
                  slide={{ direction: 'down', offset: 50 }}
                  blur
                  delay={leftSectionDelay + 0.4 * index}
                  transition={{ duration: 0.5 }}
                >
                  <div className='border-[#FF6801]/60 bg-[#FF6801]/10 flex size-16 shrink-0 items-center justify-center rounded-xl border'>
                    <IconComponent className='size-8 stroke-[1.5] text-[#FF6801]' />
                  </div>
                  <div className='space-y-2'>
                    <h4 className='text-lg font-semibold'>{item.title}</h4>
                    <p className='text-muted-foreground text-sm'>{item.description}</p>
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

export default WhyChooseTrefaSection
