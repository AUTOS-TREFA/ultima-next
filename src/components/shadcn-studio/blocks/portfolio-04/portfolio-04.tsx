'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MotionPreset } from '@/components/ui/motion-preset'
import { cn } from '@/lib/utils'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getVehicleImage } from '@/utils/getVehicleImage'
import { DEFAULT_PLACEHOLDER_IMAGE, BRAND_LOGOS } from '@/utils/constants'
import type { Vehicle } from '@/types/types'
import { Car, Truck, DollarSign, Sparkles, ArrowRight } from 'lucide-react'

export type VehiclePortfolioItem = {
  id: number
  slug: string
  image: string
  title: string
  precio: number
}

// Filter shortcuts that appear between vehicles
const filterShortcuts = [
  {
    id: 'suv',
    label: 'SUVs',
    description: 'Espaciosas y versátiles',
    href: '/autos?carroceria=SUV',
    icon: Car,
    gradient: 'from-blue-500 to-indigo-600',
    bgImage: null,
  },
  {
    id: 'pickup',
    label: 'Pick Ups',
    description: 'Potencia y capacidad',
    href: '/autos?carroceria=Pick-Up',
    icon: Truck,
    gradient: 'from-amber-500 to-orange-600',
    bgImage: null,
  },
  {
    id: 'mazda',
    label: 'Mazda',
    description: 'Diseño y rendimiento',
    href: '/autos?marca=Mazda',
    icon: null,
    gradient: 'from-red-500 to-rose-600',
    bgImage: '/images/Mazda.png',
  },
  {
    id: 'toyota',
    label: 'Toyota',
    description: 'Confiabilidad garantizada',
    href: '/autos?marca=Toyota',
    icon: null,
    gradient: 'from-gray-700 to-gray-900',
    bgImage: '/images/Toyota.png',
  },
  {
    id: 'budget',
    label: 'Menos de $350,000',
    description: 'Las mejores opciones',
    href: '/autos?precio_max=350000',
    icon: DollarSign,
    gradient: 'from-emerald-500 to-teal-600',
    bgImage: null,
  },
  {
    id: 'newest',
    label: 'Recién llegados',
    description: 'Lo más nuevo',
    href: '/autos?sort=newest',
    icon: Sparkles,
    gradient: 'from-purple-500 to-pink-600',
    bgImage: null,
  },
]

type PortfolioProps = {
  maxVehicles?: number
  title?: string
  subtitle?: string
  showButton?: boolean
}

// Filter card component
const FilterCard = ({
  filter,
  delay = 0,
  className = '',
  aspectClass = 'aspect-[4/3]'
}: {
  filter: typeof filterShortcuts[0]
  delay?: number
  className?: string
  aspectClass?: string
}) => {
  const Icon = filter.icon
  return (
    <MotionPreset
      fade
      delay={delay}
      slide={{ direction: 'up', offset: 6 }}
      blur
      transition={{ duration: 0.4 }}
      className={cn('group relative overflow-hidden rounded-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1', className)}
    >
      <Link href={filter.href} className={cn('block h-full bg-gradient-to-br', filter.gradient, aspectClass)}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          {filter.bgImage ? (
            <img
              src={filter.bgImage}
              alt={filter.label}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300"
            />
          ) : Icon ? (
            <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-white/90 mb-3 group-hover:scale-110 transition-transform duration-300" />
          ) : null}
          <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-lg">
            {filter.label}
          </h3>
          <p className="text-sm text-white/80 mt-1 hidden sm:block">
            {filter.description}
          </p>
          <div className="flex items-center gap-1 mt-3 text-white/90 text-sm font-medium group-hover:gap-2 transition-all duration-300">
            <span>Ver autos</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
    </MotionPreset>
  )
}

// Single vehicle card component
const VehicleCard = ({
  vehicle,
  delay = 0,
  className = '',
  aspectClass = 'aspect-[4/3]'
}: {
  vehicle: VehiclePortfolioItem
  delay?: number
  className?: string
  aspectClass?: string
}) => (
  <MotionPreset
    fade
    delay={delay}
    slide={{ direction: 'up', offset: 6 }}
    blur
    transition={{ duration: 0.4 }}
    className={cn('group relative overflow-hidden rounded-xl transition-shadow duration-500 hover:shadow-2xl', className)}
  >
    <Link href={`/autos/${vehicle.slug}`} className="block h-full">
      <img
        src={vehicle.image}
        alt={vehicle.title}
        className={cn('w-full h-full object-cover', aspectClass)}
      />
      {/* Hover overlay */}
      <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
      {/* Vehicle info */}
      <div className='absolute inset-x-0 bottom-0 p-3 sm:p-4 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0'>
        <h3 className='text-sm sm:text-lg font-bold text-white line-clamp-2 drop-shadow-lg'>
          {vehicle.title}
        </h3>
        <p className='text-[#FF6801] font-bold text-base sm:text-xl mt-1 drop-shadow-lg'>
          ${vehicle.precio.toLocaleString('es-MX')}
        </p>
      </div>
    </Link>
  </MotionPreset>
)

const Portfolio = ({
  maxVehicles = 12,
  title = "Nuestros Vehículos",
  subtitle = "Explora nuestra selección de autos de calidad, desde autos ejecutivos hasta camiones de trabajo, todos cuidadosamente seleccionados para ofrecerte las mejores opciones.",
  showButton = true
}: PortfolioProps) => {
  const [vehicles, setVehicles] = useState<VehiclePortfolioItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data, error } = await supabase
          .from('inventario_cache')
          .select('id, slug, title, precio, feature_image, galeria_exterior, fotos_exterior_url, separado, vendido')
          .eq('separado', false)
          .eq('vendido', false)
          .order('id', { ascending: false })
          .limit(maxVehicles * 2)

        if (error) {
          console.error('Error fetching vehicles:', error)
          return
        }

        if (data) {
          const portfolioItems: VehiclePortfolioItem[] = data
            .map(vehicle => {
              const vehicleImage = getVehicleImage(vehicle as Partial<Vehicle>)
              return {
                id: vehicle.id,
                slug: vehicle.slug || '',
                image: vehicleImage,
                title: vehicle.title || 'Vehículo',
                precio: vehicle.precio || 0
              }
            })
            .filter(item => item.image !== DEFAULT_PLACEHOLDER_IMAGE)
            .slice(0, maxVehicles)

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
      <section className='bg-white py-8 sm:py-16 lg:py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <p className='text-muted-foreground'>Cargando autos...</p>
          </div>
        </div>
      </section>
    )
  }

  if (vehicles.length === 0) {
    return (
      <section className='bg-white py-8 sm:py-16 lg:py-24'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-2xl font-semibold mb-4'>{title}</h2>
            <p className='text-muted-foreground'>No hay autos disponibles en este momento.</p>
          </div>
        </div>
      </section>
    )
  }

  // Creative mobile mosaic layout patterns with filter cards interleaved
  const renderMobileMosaic = () => {
    const elements: JSX.Element[] = []
    let idx = 0
    let patternStep = 0
    let filterIdx = 0

    while (idx < vehicles.length) {
      const baseDelay = 0.9 + (idx * 0.05)

      switch (patternStep % 6) {
        case 0:
          // Row: 2 equal cards side by side
          if (vehicles[idx] && vehicles[idx + 1]) {
            elements.push(
              <div key={`row-${idx}`} className="grid grid-cols-2 gap-2">
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[4/3]" />
                <VehicleCard vehicle={vehicles[idx + 1]} delay={baseDelay + 0.05} aspectClass="aspect-[4/3]" />
              </div>
            )
            idx += 2
          } else if (vehicles[idx]) {
            elements.push(
              <VehicleCard key={`single-${idx}`} vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[16/9]" />
            )
            idx += 1
          }
          break

        case 1:
          // Row: Filter card + vehicle card
          if (filterShortcuts[filterIdx] && vehicles[idx]) {
            elements.push(
              <div key={`filter-row-${filterIdx}`} className="grid grid-cols-2 gap-2">
                <FilterCard filter={filterShortcuts[filterIdx]} delay={baseDelay} aspectClass="aspect-[4/3]" />
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay + 0.05} aspectClass="aspect-[4/3]" />
              </div>
            )
            filterIdx++
            idx += 1
          } else if (vehicles[idx]) {
            elements.push(
              <VehicleCard key={`pano-${idx}`} vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[21/9]" />
            )
            idx += 1
          }
          break

        case 2:
          // Row: 2 stacked small on left + 1 tall on right
          if (vehicles[idx] && vehicles[idx + 1] && vehicles[idx + 2]) {
            elements.push(
              <div key={`mosaic-${idx}`} className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-2">
                  <VehicleCard vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-square" />
                  <VehicleCard vehicle={vehicles[idx + 1]} delay={baseDelay + 0.05} aspectClass="aspect-square" />
                </div>
                <VehicleCard vehicle={vehicles[idx + 2]} delay={baseDelay + 0.1} className="h-full" aspectClass="aspect-[3/4] h-full" />
              </div>
            )
            idx += 3
          } else if (vehicles[idx] && vehicles[idx + 1]) {
            elements.push(
              <div key={`row-${idx}`} className="grid grid-cols-2 gap-2">
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[4/3]" />
                <VehicleCard vehicle={vehicles[idx + 1]} delay={baseDelay + 0.05} aspectClass="aspect-[4/3]" />
              </div>
            )
            idx += 2
          } else if (vehicles[idx]) {
            elements.push(
              <VehicleCard key={`single-${idx}`} vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[16/9]" />
            )
            idx += 1
          }
          break

        case 3:
          // Row: 3 items - filter + 2 vehicles
          if (filterShortcuts[filterIdx] && vehicles[idx] && vehicles[idx + 1]) {
            elements.push(
              <div key={`triple-filter-${filterIdx}`} className="grid grid-cols-3 gap-2">
                <FilterCard filter={filterShortcuts[filterIdx]} delay={baseDelay} aspectClass="aspect-square" />
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay + 0.05} aspectClass="aspect-square" />
                <VehicleCard vehicle={vehicles[idx + 1]} delay={baseDelay + 0.1} aspectClass="aspect-square" />
              </div>
            )
            filterIdx++
            idx += 2
          } else if (vehicles[idx] && vehicles[idx + 1]) {
            elements.push(
              <div key={`row-${idx}`} className="grid grid-cols-2 gap-2">
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[4/3]" />
                <VehicleCard vehicle={vehicles[idx + 1]} delay={baseDelay + 0.05} aspectClass="aspect-[4/3]" />
              </div>
            )
            idx += 2
          } else if (vehicles[idx]) {
            elements.push(
              <VehicleCard key={`single-${idx}`} vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[16/9]" />
            )
            idx += 1
          }
          break

        case 4:
          // Row: 1 tall on left + 2 stacked small on right (inverse of case 2)
          if (vehicles[idx] && vehicles[idx + 1] && vehicles[idx + 2]) {
            elements.push(
              <div key={`mosaic-inv-${idx}`} className="grid grid-cols-2 gap-2">
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay} className="h-full" aspectClass="aspect-[3/4] h-full" />
                <div className="flex flex-col gap-2">
                  <VehicleCard vehicle={vehicles[idx + 1]} delay={baseDelay + 0.05} aspectClass="aspect-square" />
                  <VehicleCard vehicle={vehicles[idx + 2]} delay={baseDelay + 0.1} aspectClass="aspect-square" />
                </div>
              </div>
            )
            idx += 3
          } else if (vehicles[idx] && vehicles[idx + 1]) {
            elements.push(
              <div key={`row-${idx}`} className="grid grid-cols-2 gap-2">
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[4/3]" />
                <VehicleCard vehicle={vehicles[idx + 1]} delay={baseDelay + 0.05} aspectClass="aspect-[4/3]" />
              </div>
            )
            idx += 2
          } else if (vehicles[idx]) {
            elements.push(
              <VehicleCard key={`single-${idx}`} vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[16/9]" />
            )
            idx += 1
          }
          break

        case 5:
          // Row: Vehicle + filter card
          if (vehicles[idx] && filterShortcuts[filterIdx]) {
            elements.push(
              <div key={`row-vf-${idx}`} className="grid grid-cols-2 gap-2">
                <VehicleCard vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[4/3]" />
                <FilterCard filter={filterShortcuts[filterIdx]} delay={baseDelay + 0.05} aspectClass="aspect-[4/3]" />
              </div>
            )
            filterIdx++
            idx += 1
          } else if (vehicles[idx]) {
            elements.push(
              <VehicleCard key={`single-${idx}`} vehicle={vehicles[idx]} delay={baseDelay} aspectClass="aspect-[16/9]" />
            )
            idx += 1
          }
          break
      }

      patternStep++
    }

    return elements
  }

  return (
    <section className='bg-white py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 sm:px-6 lg:space-y-24 lg:px-8'>
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
            className='text-muted-foreground text-base sm:text-xl max-w-2xl mx-auto'
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
                <Link href='/autos'>Ver Inventario Completo</Link>
              </Button>
            </MotionPreset>
          )}
        </div>

        {/* Mobile Mosaic Layout */}
        <div className='sm:hidden flex flex-col gap-2'>
          {renderMobileMosaic()}
        </div>

        {/* Desktop 4-Column Layout with interleaved filter cards */}
        <div className='hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6'>
          {Array.from({ length: 4 }).map((_, colIndex) => {
            // Get vehicles for this column
            const columnVehicles = vehicles.filter((_, index) => index % 4 === colIndex)
            // Determine which filter to show in this column (if any)
            const filterForColumn = colIndex < filterShortcuts.length ? filterShortcuts[colIndex] : null
            // Insert filter after first vehicle in each column
            const filterInsertIndex = 1

            return (
              <div
                key={colIndex}
                className={cn('space-y-6', {
                  'sm:mt-12': colIndex === 1 || colIndex === 3
                })}
              >
                {columnVehicles.map((vehicle, index) => {
                  const baseDelay = 0.9 + ((colIndex * 3 + index) * 0.05)
                  const elements: JSX.Element[] = []

                  // Add vehicle card
                  elements.push(
                    <MotionPreset
                      key={vehicle.id}
                      fade
                      delay={baseDelay}
                      slide={{ direction: 'up', offset: 6 }}
                      blur
                      transition={{ duration: 0.4 }}
                      className='group relative overflow-hidden rounded-xl transition-shadow duration-500 hover:shadow-2xl'
                    >
                      <Link href={`/autos/${vehicle.slug}`}>
                        <img
                          src={vehicle.image}
                          alt={vehicle.title}
                          className='aspect-auto w-full object-cover'
                        />
                        <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
                        <div className='absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0'>
                          <h3 className='text-lg font-bold text-white line-clamp-2 drop-shadow-lg'>
                            {vehicle.title}
                          </h3>
                          <p className='text-[#FF6801] font-bold text-xl mt-1 drop-shadow-lg'>
                            ${vehicle.precio.toLocaleString('es-MX')}
                          </p>
                        </div>
                      </Link>
                    </MotionPreset>
                  )

                  // Insert filter card after first vehicle in each column
                  if (index === filterInsertIndex && filterForColumn) {
                    elements.push(
                      <FilterCard
                        key={`filter-${filterForColumn.id}`}
                        filter={filterForColumn}
                        delay={baseDelay + 0.05}
                        aspectClass="aspect-[4/3]"
                      />
                    )
                  }

                  return elements
                })}

                {/* Add remaining filters to columns that have fewer vehicles */}
                {columnVehicles.length <= filterInsertIndex && filterForColumn && (
                  <FilterCard
                    key={`filter-${filterForColumn.id}`}
                    filter={filterForColumn}
                    delay={0.9 + (colIndex * 0.1)}
                    aspectClass="aspect-[4/3]"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Additional filter shortcuts row on desktop */}
        <div className='hidden sm:grid grid-cols-3 lg:grid-cols-6 gap-4 mt-8'>
          {filterShortcuts.map((filter, idx) => (
            <Link
              key={filter.id}
              href={filter.href}
              className={cn(
                'group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
                filter.gradient
              )}
            >
              {filter.bgImage ? (
                <img src={filter.bgImage} alt={filter.label} className="w-8 h-8 object-contain" />
              ) : filter.icon ? (
                <filter.icon className="w-6 h-6 text-white" />
              ) : null}
              <span className="text-white font-semibold text-sm">{filter.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Portfolio
