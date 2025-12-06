'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MotionPreset } from '@/components/ui/motion-preset'
import { cn } from '@/lib/utils'
import { supabase } from '../../../../../supabaseClient'

export type VehiclePortfolioItem = {
  id: string
  image: string
  marca: string
  modelo: string
  año: number
  precio: number
  estado: string
}

type PortfolioProps = {
  maxVehicles?: number
  title?: string
  subtitle?: string
  showButton?: boolean
}

const Portfolio = ({
  maxVehicles = 12,
  title = "Nuestros Vehículos",
  subtitle = "Explora nuestra selección de vehículos de calidad, desde autos ejecutivos hasta camiones de trabajo, todos cuidadosamente seleccionados para ofrecerte las mejores opciones.",
  showButton = true
}: PortfolioProps) => {
  const [vehicles, setVehicles] = useState<VehiclePortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const { data, error } = await supabase
          .from('inventario')
          .select('id, marca, modelo, año, precio, fotos_airtable, estado')
          .not('fotos_airtable', 'is', null)
          .neq('fotos_airtable', '[]')
          .order('created_at', { ascending: false })
          .limit(maxVehicles)

        if (error) {
          console.error('Error fetching vehicles:', error)
          return
        }

        if (data) {
          const portfolioItems: VehiclePortfolioItem[] = data
            .filter(vehicle => {
              // Asegurarse de que tenga fotos válidas
              if (!vehicle.fotos_airtable) return false
              const photos = typeof vehicle.fotos_airtable === 'string'
                ? JSON.parse(vehicle.fotos_airtable)
                : vehicle.fotos_airtable
              return Array.isArray(photos) && photos.length > 0
            })
            .map(vehicle => {
              const photos = typeof vehicle.fotos_airtable === 'string'
                ? JSON.parse(vehicle.fotos_airtable)
                : vehicle.fotos_airtable

              return {
                id: vehicle.id,
                image: photos[0],
                marca: vehicle.marca || 'N/A',
                modelo: vehicle.modelo || 'N/A',
                año: vehicle.año || new Date().getFullYear(),
                precio: vehicle.precio || 0,
                estado: vehicle.estado || 'disponible'
              }
            })

          setVehicles(portfolioItems)
        }
      } catch (error) {
        console.error('Error processing vehicles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [maxVehicles])

  if (loading) {
    return (
      <section className='bg-muted py-8 sm:py-16 lg:py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>Cargando vehículos...</p>
          </div>
        </div>
      </section>
    )
  }

  if (vehicles.length === 0) {
    return (
      <section className='bg-muted py-8 sm:py-16 lg:py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-2xl font-semibold mb-4'>{title}</h2>
            <p className='text-muted-foreground'>No hay vehículos disponibles en este momento.</p>
          </div>
        </div>
      </section>
    )
  }

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
            {title}
          </MotionPreset>

          <MotionPreset
            component='p'
            fade
            slide={{ direction: 'down', offset: 50 }}
            delay={0.2}
            transition={{ duration: 0.4 }}
            className='text-muted-foreground text-xl'
          >
            {subtitle}
          </MotionPreset>

          {showButton && (
            <MotionPreset
              fade
              slide={{ direction: 'down', offset: 50 }}
              delay={0.4}
              transition={{ duration: 0.4 }}
              className='flex justify-center'
            >
              <Button size='lg' className='rounded-lg text-base' asChild>
                <Link href='/inventory'>Ver Inventario Completo</Link>
              </Button>
            </MotionPreset>
          )}
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
                    <Link href={`/inventory?id=${vehicle.id}`}>
                      <img
                        src={vehicle.image}
                        alt={`${vehicle.marca} ${vehicle.modelo} ${vehicle.año}`}
                        className='aspect-auto w-full object-cover'
                      />

                      <div className='absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 transition-opacity duration-500 group-hover:opacity-100' />

                      <Card className='border-primary group-hover:animate-in group-hover:slide-in-from-bottom-4 group-hover:fade-in absolute inset-x-6 bottom-6 py-4 opacity-0 transition-all duration-500 group-hover:opacity-100'>
                        <CardContent className='space-y-1 px-4 text-center'>
                          <span className='text-muted-foreground text-xs'>
                            {vehicle.año} • {vehicle.estado}
                          </span>
                          <h3 className='text-lg font-semibold'>
                            {vehicle.marca} {vehicle.modelo}
                          </h3>
                          <p className='text-primary font-bold'>
                            ${vehicle.precio.toLocaleString('es-MX')}
                          </p>
                        </CardContent>
                      </Card>
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

export default Portfolio
