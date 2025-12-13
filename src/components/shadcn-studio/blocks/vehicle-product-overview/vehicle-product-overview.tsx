'use client'

import { useId, useState, useMemo, useCallback } from 'react'

import {
  HeartIcon,
  StarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MapPinIcon,
  GaugeIcon,
  FuelIcon,
  CogIcon,
  CarIcon,
  MessageCircleIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  EyeIcon,
  UsersIcon,
  BanknoteIcon,
  BuildingIcon,
  WalletIcon,
  DatabaseIcon,
  FileTextIcon,
  CalculatorIcon,
  CheckIcon,
  CalendarIcon,
  WrenchIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'
import { formatPrice, formatMileage } from '@/utils/formatters'
import { getVehicleImage } from '@/utils/getVehicleImage'
import { calculateMonthlyPayment } from '@/utils/financeCalculator'
import type { WordPressVehicle } from '@/types/types'

// Types
type TabId = 'specs' | 'calculator' | 'inspection'

interface InspectionReportData {
  inspection_points?: Record<string, string[]>
  past_owners?: number
}

type VehicleProductOverviewProps = {
  vehicle: WordPressVehicle
  onFinancingClick: () => void
  onWhatsAppClick: () => void
  onFavoriteClick: () => void
  isFavorite: boolean
  favoriteCount: number
  inspectionData?: InspectionReportData | null
  inspectionLoading?: boolean
}

// Tab configuration
const TABS = [
  { id: 'specs' as TabId, label: 'Ficha Técnica', icon: FileTextIcon },
  { id: 'calculator' as TabId, label: 'Calculadora', icon: CalculatorIcon },
  { id: 'inspection' as TabId, label: 'Inspección', icon: ShieldCheckIcon },
]

const VehicleProductOverview = ({
  vehicle,
  onFinancingClick,
  onWhatsAppClick,
  onFavoriteClick,
  isFavorite,
  favoriteCount,
  inspectionData = null,
  inspectionLoading = false
}: VehicleProductOverviewProps) => {
  const id = useId()

  // State
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('specs')
  const [downPayment, setDownPayment] = useState(0)
  const [loanTerm, setLoanTerm] = useState(48)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0)

  // Get all vehicle images for gallery
  const allImages = useMemo(() => {
    const mainImage = getVehicleImage(vehicle)
    const exteriorGallery = vehicle.galeria_exterior || []
    const interiorGallery = vehicle.galeria_interior || []

    // Combine all images, starting with main, then exterior, then interior
    const images: string[] = []
    if (mainImage) images.push(mainImage)
    exteriorGallery.forEach(img => {
      if (img && !images.includes(img)) images.push(img)
    })
    interiorGallery.forEach(img => {
      if (img && !images.includes(img)) images.push(img)
    })

    return images.length > 0 ? images : ['/placeholder-car.jpg']
  }, [vehicle])

  // Navigation handlers for gallery
  const goToPrevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1))
  }, [allImages.length])

  const goToNextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1))
  }, [allImages.length])

  const goToImage = useCallback((index: number) => {
    setCurrentImageIndex(index)
  }, [])

  // Thumbnail navigation (show 5 at a time)
  const visibleThumbnails = 5
  const canScrollThumbnailsLeft = thumbnailStartIndex > 0
  const canScrollThumbnailsRight = thumbnailStartIndex + visibleThumbnails < allImages.length

  const scrollThumbnailsLeft = useCallback(() => {
    setThumbnailStartIndex(prev => Math.max(0, prev - 1))
  }, [])

  const scrollThumbnailsRight = useCallback(() => {
    setThumbnailStartIndex(prev => Math.min(allImages.length - visibleThumbnails, prev + 1))
  }, [allImages.length])

  // Finance data
  const financeData = useMemo(() => {
    const price = vehicle.precio || 0
    const minDownPayment = Math.round(price * 0.25)
    const maxDownPayment = Math.round(price * 0.70)
    const currentDownPayment = downPayment || minDownPayment
    const monthlyPayment = calculateMonthlyPayment(price, currentDownPayment, loanTerm, 17, true)
    const loanTerms = [24, 36, 48, 60].filter(term => term <= (vehicle.plazomax || 60))

    return {
      price,
      minDownPayment,
      maxDownPayment,
      monthlyPayment,
      loanTerms
    }
  }, [vehicle.precio, vehicle.plazomax, downPayment, loanTerm])

  // Initialize downPayment
  useMemo(() => {
    if (downPayment === 0 && financeData.minDownPayment > 0) {
      setDownPayment(financeData.minDownPayment)
    }
  }, [financeData.minDownPayment, downPayment])

  // Specifications for Ficha tab
  const specifications = useMemo(() => {
    const specs = []
    if (vehicle.marca) specs.push({ label: 'Marca', value: vehicle.marca })
    if (vehicle.modelo) specs.push({ label: 'Modelo', value: vehicle.modelo })
    if (vehicle.autoano) specs.push({ label: 'Año', value: vehicle.autoano })
    if (vehicle.kilometraje) specs.push({ label: 'Kilometraje', value: formatMileage(vehicle.kilometraje) })
    if (vehicle.color_exterior) specs.push({ label: 'Color Exterior', value: vehicle.color_exterior })
    if (vehicle.color_interior) specs.push({ label: 'Color Interior', value: vehicle.color_interior })
    if (vehicle.transmision) specs.push({ label: 'Transmisión', value: vehicle.transmision })
    if (vehicle.combustible) specs.push({ label: 'Combustible', value: vehicle.combustible })
    if (vehicle.motor || vehicle.automotor) specs.push({ label: 'Motor', value: vehicle.motor || vehicle.automotor })
    if (vehicle.cilindros || vehicle.autocilindros) specs.push({ label: 'Cilindros', value: vehicle.cilindros || vehicle.autocilindros })
    if (vehicle.garantia) specs.push({ label: 'Garantía', value: vehicle.garantia })
    if (vehicle.nosiniestros) specs.push({ label: 'Siniestros', value: vehicle.nosiniestros })
    return specs
  }, [vehicle])

  // Action cards
  const actionCards = useMemo(() => {
    const sucursal = vehicle.sucursal?.[0] || 'Monterrey'
    return [
      {
        title: 'Comprar al contado',
        subtitle: 'Asesoría profesional',
        action: 'Comenzar chat',
        icon: BanknoteIcon,
        onClick: onWhatsAppClick,
        color: 'text-green-600'
      },
      {
        title: 'Comprar a crédito',
        subtitle: '100% en línea',
        action: 'Iniciar trámite',
        icon: CreditCardIcon,
        onClick: onFinancingClick,
        color: 'text-orange-500'
      },
      {
        title: 'Comprar en sucursal',
        subtitle: `Sucursal ${sucursal}`,
        action: 'Programar cita',
        icon: BuildingIcon,
        onClick: onWhatsAppClick,
        color: 'text-blue-600'
      }
    ]
  }, [vehicle.sucursal, onWhatsAppClick, onFinancingClick])

  // Vehicle specs for tags
  const vehicleSpecs = useMemo(() => {
    const specs = []
    if (vehicle.kilometraje) {
      specs.push({ icon: GaugeIcon, text: formatMileage(vehicle.kilometraje) })
    }
    if (vehicle.transmision) {
      specs.push({ icon: CogIcon, text: vehicle.transmision })
    }
    if (vehicle.combustible) {
      specs.push({ icon: FuelIcon, text: vehicle.combustible })
    }
    if (vehicle.cilindros || vehicle.autocilindros) {
      specs.push({ icon: DatabaseIcon, text: `${vehicle.cilindros || vehicle.autocilindros} Cilindros` })
    }
    if (vehicle.clasificacionid?.[0]) {
      specs.push({ icon: CarIcon, text: vehicle.clasificacionid[0] })
    }
    if (vehicle.sucursal?.[0]) {
      specs.push({ icon: MapPinIcon, text: vehicle.sucursal[0] })
    }
    return specs
  }, [vehicle])

  const hasPromotion = vehicle.promociones && vehicle.promociones.length > 0

  // Description handling
  const description = vehicle.descripcion || vehicle.description || ''
  const wordCount = description.split(/\s+/).filter(Boolean).length
  const shouldTruncate = wordCount > 500 && !showFullDescription
  const displayDescription = shouldTruncate
    ? description.split(/\s+/).slice(0, 500).join(' ') + '...'
    : description

  // Inspection points
  const inspectionPoints = useMemo(() => {
    if (!inspectionData?.inspection_points) return []
    return Object.values(inspectionData.inspection_points)
      .map(p => p[0])
      .filter(Boolean)
  }, [inspectionData])

  return (
    <section className='py-4 sm:py-6'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div>
          {/* Image Gallery with Navigation */}
          <div className='mb-4 space-y-3'>
            {/* Main Image with Navigation Arrows */}
            <div className='relative overflow-hidden rounded-xl bg-gray-100 aspect-[16/9]'>
              <img
                src={allImages[currentImageIndex]}
                alt={`${vehicle.title} - Imagen ${currentImageIndex + 1}`}
                className='w-full h-full object-cover transition-opacity duration-300'
              />

              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevImage}
                    className='absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2.5 shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500'
                    aria-label='Imagen anterior'
                  >
                    <ChevronLeftIcon className='size-5' />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className='absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2.5 shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500'
                    aria-label='Siguiente imagen'
                  >
                    <ChevronRightIcon className='size-5' />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className='absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full'>
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </div>

            {/* Thumbnail Slider */}
            {allImages.length > 1 && (
              <div className='relative flex items-center gap-2'>
                {/* Left Arrow for Thumbnails */}
                <button
                  onClick={scrollThumbnailsLeft}
                  disabled={!canScrollThumbnailsLeft}
                  className={cn(
                    'shrink-0 p-1.5 rounded-full border transition-all',
                    canScrollThumbnailsLeft
                      ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                      : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'
                  )}
                  aria-label='Ver miniaturas anteriores'
                >
                  <ChevronLeftIcon className='size-4' />
                </button>

                {/* Thumbnails Container */}
                <div className='flex-1 overflow-hidden'>
                  <div className='flex gap-2 transition-transform duration-300'>
                    {allImages.slice(thumbnailStartIndex, thumbnailStartIndex + visibleThumbnails).map((img, idx) => {
                      const actualIndex = thumbnailStartIndex + idx
                      return (
                        <button
                          key={actualIndex}
                          onClick={() => goToImage(actualIndex)}
                          className={cn(
                            'shrink-0 w-[calc(20%-6.4px)] aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all',
                            currentImageIndex === actualIndex
                              ? 'border-orange-500 ring-2 ring-orange-200'
                              : 'border-transparent hover:border-gray-300'
                          )}
                        >
                          <img
                            src={img}
                            alt={`Miniatura ${actualIndex + 1}`}
                            className='w-full h-full object-cover'
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Right Arrow for Thumbnails */}
                <button
                  onClick={scrollThumbnailsRight}
                  disabled={!canScrollThumbnailsRight}
                  className={cn(
                    'shrink-0 p-1.5 rounded-full border transition-all',
                    canScrollThumbnailsRight
                      ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                      : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'
                  )}
                  aria-label='Ver más miniaturas'
                >
                  <ChevronRightIcon className='size-4' />
                </button>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className='grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {/* Left Column - Vehicle Info */}
            <div className='space-y-4 sm:space-y-5 lg:col-span-2'>
              {/* Title and Price Row */}
              <div className='space-y-2 sm:space-y-3'>
                <div className='flex items-start justify-between gap-3 flex-wrap'>
                  <div className='space-y-0.5'>
                    <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold leading-tight'>
                      {vehicle.title} <span className='text-muted-foreground font-normal'>{vehicle.autoano || vehicle.year}</span>
                    </h1>
                    {hasPromotion && (
                      <Badge className='px-2 py-0.5 bg-green-100 text-green-700 border-none text-xs'>
                        Promoción
                      </Badge>
                    )}
                  </div>
                  {/* Price in header */}
                  <div className='text-right'>
                    {!hasPromotion ? (
                      <h2 className='text-xl sm:text-2xl lg:text-3xl font-extrabold text-orange-500'>
                        {formatPrice(vehicle.precio)}
                      </h2>
                    ) : (
                      <div className='space-y-0.5'>
                        <h2 className='text-xl sm:text-2xl lg:text-3xl font-extrabold text-orange-500'>{formatPrice(vehicle.precio_reduccion || vehicle.precio)}</h2>
                        {vehicle.precio_reduccion && vehicle.precio_reduccion < vehicle.precio && (
                          <span className='text-sm sm:text-base text-muted-foreground line-through'>{formatPrice(vehicle.precio)}</span>
                        )}
                      </div>
                    )}
                    <span className='text-xs sm:text-sm text-muted-foreground'>MXN</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className='flex items-center gap-2 sm:gap-3 flex-wrap'>
                  {/* Active promotions for this vehicle */}
                  {hasPromotion && vehicle.promociones?.map((promo, index) => (
                    <Badge key={index} className='gap-1.5 rounded-md border-none bg-orange-500 px-3 py-1.5 text-white'>
                      <StarIcon className='size-3.5 fill-white stroke-white' />
                      {promo}
                    </Badge>
                  ))}
                  <span className='text-muted-foreground text-sm flex items-center gap-1'>
                    <EyeIcon className='size-4' />
                    {(vehicle.view_count || 0).toLocaleString('es-MX')} vistas
                  </span>
                  <span className='text-muted-foreground text-sm flex items-center gap-1'>
                    <HeartIcon className='size-4' />
                    {favoriteCount} favoritos
                  </span>
                </div>
              </div>

              {/* Vehicle Specs Tags */}
              <div className='flex flex-wrap gap-1.5 sm:gap-2'>
                {vehicleSpecs.map((spec, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-gray-100 text-gray-700'
                  >
                    <spec.icon className='size-3.5 sm:size-4 text-orange-500' />
                    <span className='font-medium text-xs sm:text-sm'>{spec.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Cards - Purchase Options */}
              <div className='space-y-2 sm:space-y-3'>
                <h3 className='flex items-center gap-2 text-base sm:text-lg font-semibold'>
                  <WalletIcon className='text-orange-500 size-4 sm:size-5' />
                  Opciones de Compra
                </h3>
                <div className='grid gap-2 sm:gap-4 sm:grid-cols-3'>
                  {actionCards.map(card => (
                    <button
                      key={card.title}
                      onClick={card.onClick}
                      className='group text-left space-y-1 sm:space-y-2 rounded-xl border-2 border-gray-200 hover:border-orange-300 px-3 py-2.5 sm:px-5 sm:py-4 transition-all hover:shadow-md bg-white'
                    >
                      <div className='flex items-center gap-2'>
                        <card.icon className={cn('size-4 sm:size-5', card.color)} />
                        <h4 className='font-semibold text-gray-900 text-sm sm:text-base'>{card.title}</h4>
                      </div>
                      <p className='text-muted-foreground text-xs sm:text-sm'>{card.subtitle}</p>
                      <span className='inline-flex items-center gap-1 text-orange-500 font-medium text-xs sm:text-sm group-hover:gap-2 transition-all'>
                        {card.action}
                        <ChevronRightIcon className='size-3.5 sm:size-4' />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              {description && (
                <div className='space-y-2 sm:space-y-3'>
                  <h3 className='text-base sm:text-lg font-semibold'>Descripción</h3>
                  <div
                    className='prose prose-sm max-w-none text-gray-600 prose-headings:text-gray-900 prose-strong:text-gray-900'
                    dangerouslySetInnerHTML={{ __html: displayDescription }}
                  />
                  {wordCount > 500 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className='text-orange-500 hover:text-orange-600 font-medium text-sm inline-flex items-center gap-1'
                    >
                      {showFullDescription ? 'Ver menos' : 'Leer más'}
                      <ChevronRightIcon className={cn('size-4 transition-transform', showFullDescription && 'rotate-90')} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Tabs & Actions */}
            <div className='space-y-4 sm:space-y-6'>
              {/* Tabs Section */}
              <div className='rounded-xl border-2 border-gray-200 bg-white overflow-hidden'>
                {/* Tab Headers */}
                <div className='flex border-b'>
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-semibold transition-colors',
                        activeTab === tab.id
                          ? 'border-b-2 border-orange-500 text-orange-600 bg-orange-50'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                      )}
                    >
                      <tab.icon className='size-4' />
                      <span className='hidden sm:inline'>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className='p-4'>
                  {/* Ficha Técnica */}
                  {activeTab === 'specs' && (
                    <dl className='space-y-1'>
                      {specifications.map(spec => (
                        <div key={spec.label} className='flex justify-between py-2 border-b border-gray-100'>
                          <dt className='text-sm text-gray-600'>{spec.label}</dt>
                          <dd className='text-sm font-semibold text-gray-900'>{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {/* Calculadora */}
                  {activeTab === 'calculator' && (
                    <div className='space-y-5'>
                      <div>
                        <label htmlFor='downPayment' className='block text-sm font-medium text-gray-700 mb-2'>
                          Enganche: <span className='font-bold text-orange-600'>{formatPrice(downPayment)}</span>
                        </label>
                        <input
                          id='downPayment'
                          type='range'
                          min={financeData.minDownPayment}
                          max={financeData.maxDownPayment}
                          step='5000'
                          value={downPayment}
                          onChange={e => setDownPayment(Number(e.target.value))}
                          className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500'
                        />
                        <div className='flex justify-between text-xs text-gray-500 mt-1'>
                          <span>{formatPrice(financeData.minDownPayment)}</span>
                          <span>{formatPrice(financeData.maxDownPayment)}</span>
                        </div>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Plazo (meses):</label>
                        <div className='grid grid-cols-4 gap-2'>
                          {financeData.loanTerms.map((term: number) => (
                            <button
                              key={term}
                              onClick={() => setLoanTerm(term)}
                              className={cn(
                                'px-2 py-1.5 text-xs font-semibold rounded-md transition-colors',
                                loanTerm === term
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              )}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className='pt-4 border-t border-dashed'>
                        <div className='flex justify-between items-baseline py-1'>
                          <span className='text-sm font-semibold text-gray-800'>Mensualidad estimada</span>
                          <span className='text-2xl font-bold text-orange-600'>{formatPrice(financeData.monthlyPayment)}</span>
                        </div>
                        <div className='flex justify-between items-baseline py-1'>
                          <span className='text-sm text-gray-600'>Tasa de interés</span>
                          <span className='text-sm font-semibold text-gray-800'>17%* puede variar</span>
                        </div>
                      </div>

                      <p className='text-xs text-gray-500 text-center'>
                        *Tasa de interés puede variar según el banco. Incluye seguro con valor del 5% del auto.
                      </p>
                    </div>
                  )}

                  {/* Inspección */}
                  {activeTab === 'inspection' && (
                    inspectionLoading ? (
                      <p className='text-gray-500 text-sm'>Cargando reporte...</p>
                    ) : inspectionData ? (
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2'>
                          <ShieldCheckIcon className='size-5 text-orange-500' />
                          <h4 className='font-bold text-orange-600'>TREFA Certificado</h4>
                        </div>
                        <ul className='space-y-2 text-sm text-gray-700'>
                          {inspectionPoints.slice(0, 4).map((point, i) => (
                            <li key={i} className='flex items-start gap-2'>
                              <CheckIcon className='size-4 text-green-500 flex-shrink-0 mt-0.5' />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                        <button className='text-sm font-semibold text-orange-500 hover:underline'>
                          Ver reporte de inspección completo →
                        </button>
                      </div>
                    ) : (
                      <div className='text-center p-4 bg-gray-50 rounded-lg'>
                        <p className='text-sm font-semibold text-gray-700'>Reporte de Inspección no Disponible</p>
                        <p className='text-xs text-gray-500 mt-1'>Este auto aún no tiene un reporte de inspección público.</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Warranty Section */}
              {vehicle.garantia && (
                <div className='rounded-xl border border-green-200 bg-green-50/50 p-4'>
                  <div className='flex items-start gap-3'>
                    <div className='shrink-0 p-2 bg-green-100 rounded-lg'>
                      <ShieldCheckIcon className='size-5 text-green-600' />
                    </div>
                    <div className='space-y-1.5'>
                      <h4 className='font-semibold text-green-800 text-sm'>Garantía Incluida</h4>
                      <p className='text-green-700 text-sm'>{vehicle.garantia}</p>
                      <div className='flex flex-wrap gap-2 pt-1'>
                        <span className='inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full'>
                          <WrenchIcon className='size-3' />
                          Motor y transmisión
                        </span>
                        <span className='inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full'>
                          <CalendarIcon className='size-3' />
                          Cobertura limitada
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Card */}
              <div className='rounded-xl border-2 border-gray-200 p-5 bg-white space-y-4'>
                {/* Buttons */}
                <div className='flex flex-col gap-3'>
                  <Button
                    className='w-full bg-orange-500 hover:bg-orange-600 text-white'
                    size='lg'
                    onClick={onFinancingClick}
                  >
                    <CreditCardIcon className='mr-2 size-5' />
                    Comprar con Financiamiento
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600'
                    size='lg'
                    onClick={onWhatsAppClick}
                  >
                    <MessageCircleIcon className='mr-2 size-5' />
                    Contactar por WhatsApp
                  </Button>
                  <Button
                    variant='outline'
                    size='lg'
                    className='w-full border-2'
                    onClick={onFavoriteClick}
                  >
                    <HeartIcon className={cn('mr-2 size-5', isFavorite && 'fill-red-500 text-red-500')} />
                    {isFavorite ? 'Guardado' : 'Guardar'} ({favoriteCount})
                  </Button>
                </div>

                {/* Trust badges */}
                <div className='flex items-center justify-center gap-4 pt-3 border-t'>
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <ShieldCheckIcon className='size-4 text-green-500' />
                    Garantía incluida
                  </div>
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    <UsersIcon className='size-4 text-blue-500' />
                    1 dueño anterior
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default VehicleProductOverview
