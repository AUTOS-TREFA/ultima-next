'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MotionPreset } from '@/components/ui/motion-preset'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/utils/formatters'
import Link from 'next/link'

export type VehiclePortfolioItem = {
  id: number
  slug: string
  image: string
  titulo: string
  precio: number
}

type VehiclePortfolioProps = {
  vehicles: VehiclePortfolioItem[]
}

const VehiclePortfolio = ({ vehicles }: VehiclePortfolioProps) => {
  return (
    <section className='bg-muted py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:space-y-24 lg:px-8'>
        {/* Section Header */}
        <div className='space-y-4 text-center'>
          <MotionPreset
            component='h2'
            fade
            slide={{ direction: 'down', offset: 50 }}
            transition={{ duration: 0.4 }}
            className='inline-block text-2xl font-semibold sm:text-3xl lg:text-4xl'
          >
            Autos Vendidos
          </MotionPreset>

          <MotionPreset
            component='p'
            fade
            slide={{ direction: 'down', offset: 50 }}
            delay={0.2}
            transition={{ duration: 0.4 }}
            className='text-muted-foreground text-xl'
          >
            Una muestra de los vehículos que nuestros clientes han comprado recientemente. Cada auto vendido representa una historia de éxito y confianza.
          </MotionPreset>

          <MotionPreset
            fade
            slide={{ direction: 'down', offset: 50 }}
            delay={0.4}
            transition={{ duration: 0.4 }}
            className='flex justify-center'
          >
            <Button size='lg' className='rounded-lg text-base' asChild>
              <Link href='/autos'>Ver Inventario Disponible</Link>
            </Button>
          </MotionPreset>
        </div>

        {/* Portfolio Items */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={cn('space-y-6', {
                'sm:mt-24': colIndex === 1 || colIndex === 3
              })}
            >
              {vehicles
                .filter((_, index) => index % 4 === colIndex)
                .map((vehicle, index) => (
                  <MotionPreset
                    key={vehicle.id}
                    fade
                    delay={
                      0.9 +
                      ((Array.from({ length: colIndex }).reduce(
                        (sum: number, _, i) => sum + vehicles.filter((_, idx) => idx % 4 === i).length,
                        0
                      ) +
                        index) *
                        5) /
                        100
                    }
                    slide={{ direction: 'up', offset: 6 }}
                    blur
                    transition={{ duration: 0.4 }}
                    className='group relative overflow-hidden rounded-xl transition-shadow duration-500 hover:shadow-2xl'
                  >
                    <Link href={`/autos/${vehicle.slug}`} className='block'>
                      <img src={vehicle.image} alt={vehicle.titulo} className='aspect-auto w-full object-cover' />

                      <div className='absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

                      <Card className='border-primary group-hover:animate-in group-hover:slide-in-from-bottom-4 group-hover:fade-in absolute inset-x-6 bottom-6 py-4 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <CardContent className='space-y-1 px-4 text-center'>
                          <h3 className='text-lg font-semibold line-clamp-2'>{vehicle.titulo}</h3>
                          <span className='text-muted-foreground text-base font-bold'>{formatPrice(vehicle.precio)}</span>
                        </CardContent>
                      </Card>

                      <div className='bg-card absolute top-2 left-2 px-3 py-1 rounded-full'>
                        <span className='text-xs font-semibold text-green-600'>Vendido</span>
                      </div>
                    </Link>
                  </MotionPreset>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default VehiclePortfolio
