'use client'

import { useId, useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import Link from 'next/link'

import {
  HeartIcon,
  StarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
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
  CalendarIcon,
  WrenchIcon,
  XIcon,
  ZoomInIcon,
  CheckIcon,
  ClockIcon,
  TruckIcon,
  PhoneIcon,
  SparklesIcon,
  BadgeCheckIcon,
  CircleDotIcon,
  PaletteIcon,
  Settings2Icon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { cn } from '@/lib/utils'
import { formatPrice, formatMileage } from '@/utils/formatters'
import { getVehicleImage } from '@/utils/getVehicleImage'
import { calculateMonthlyPayment } from '@/utils/financeCalculator'
import type { WordPressVehicle } from '@/types/types'

// Types
interface InspectionReportData {
  inspection_points?: Record<string, string[]>
  past_owners?: number
}

type LightboxMediaItem = {
  type: 'image' | 'video'
  url: string
}

type VehicleProductOverviewProps = {
  vehicle: WordPressVehicle
  onFinancingClick: () => void
  onWhatsAppClick: () => void
  onFavoriteClick: () => void
  onCalculatorInteraction?: () => void
  isFavorite: boolean
  favoriteCount: number
  inspectionData?: InspectionReportData | null
  inspectionLoading?: boolean
}

// Lightbox Component
const Lightbox = ({
  media,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  setCurrentIndex
}: {
  media: LightboxMediaItem[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  setCurrentIndex: (index: number) => void
}) => {
  const [showZoom, setShowZoom] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const ZOOM_LEVEL = 3

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, onPrev, onNext])

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.pageX - left) / width) * 100
    const y = ((e.pageY - top) / height) * 100
    setMousePosition({ x, y })
  }

  const currentItem = media[currentIndex]
  if (!currentItem) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[1001] flex items-center gap-2 px-4 py-2.5 bg-white text-black font-bold rounded-full shadow-xl hover:bg-gray-100 transition-all"
        aria-label="Cerrar"
      >
        <XIcon className="w-5 h-5" />
        <span>Cerrar</span>
      </button>

      {/* Zoom indicator */}
      <div className="fixed top-4 left-4 z-[1001] flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white text-sm rounded-full backdrop-blur-sm">
        <ZoomInIcon className="w-4 h-4" />
        <span>Pasa el mouse para hacer zoom</span>
      </div>

      {/* Prev button */}
      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-10 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
          aria-label="Anterior"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>
      )}

      {/* Content */}
      <div
        className="max-w-screen-xl max-h-[85vh] w-full flex items-center justify-center px-16"
        onClick={onClose}
      >
        {currentItem.type === 'image' && (
          <div
            className="relative cursor-crosshair"
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentItem.url}
              alt={`Imagen ${currentIndex + 1} de ${media.length}`}
              className="object-contain w-auto h-auto max-w-full max-h-[85vh] rounded-lg"
            />
            {showZoom && (
              <div
                className="absolute pointer-events-none w-64 h-64 rounded-full border-4 border-white/80 bg-no-repeat shadow-2xl"
                style={{
                  left: `${mousePosition.x}%`,
                  top: `${mousePosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundImage: `url(${currentItem.url})`,
                  backgroundSize: `${100 * ZOOM_LEVEL}%`,
                  backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Next button */}
      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-10 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
          aria-label="Siguiente"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      )}

      {/* Counter and thumbnails at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10">
        {/* Thumbnail strip */}
        <div className="flex gap-2 bg-black/60 p-2 rounded-xl backdrop-blur-sm">
          {media.slice(0, 10).map((item, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
              className={cn(
                'w-16 h-12 rounded-md overflow-hidden border-2 transition-all',
                currentIndex === idx ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img src={item.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        {/* Counter */}
        <div className="bg-white/10 text-white text-sm px-4 py-2 rounded-full font-medium backdrop-blur-sm">
          {currentIndex + 1} / {media.length}
        </div>
      </div>
    </div>
  )
}

// Key Highlight Component (CarMax style)
const KeyHighlight = ({
  icon: Icon,
  label,
  value,
  className
}: {
  icon: React.ElementType
  label: string
  value: string
  className?: string
}) => (
  <div className={cn('flex items-center gap-3 py-3', className)}>
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
      <Icon className="w-5 h-5 text-orange-600" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
    </div>
  </div>
)

const VehicleProductOverview = ({
  vehicle,
  onFinancingClick,
  onWhatsAppClick,
  onFavoriteClick,
  onCalculatorInteraction,
  isFavorite,
  favoriteCount,
  inspectionData = null,
  inspectionLoading = false
}: VehicleProductOverviewProps) => {
  const id = useId()

  // State
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [downPayment, setDownPayment] = useState(0)
  const [loanTerm, setLoanTerm] = useState(48)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

  // Get all vehicle images for gallery
  const allImages = useMemo(() => {
    const mainImage = getVehicleImage(vehicle)
    const exteriorGallery = vehicle.galeria_exterior || []
    const interiorGallery = vehicle.galeria_interior || []

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

  // Lightbox media
  const lightboxMedia = useMemo<LightboxMediaItem[]>(() => {
    return allImages.map(url => ({ type: 'image' as const, url }))
  }, [allImages])

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

  // Swipe handlers
  const handleDragStart = () => setIsDragging(true)
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50
    if (info.offset.x > swipeThreshold) {
      goToPrevImage()
    } else if (info.offset.x < -swipeThreshold) {
      goToNextImage()
    }
    setTimeout(() => setIsDragging(false), 100)
  }

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailContainerRef.current) {
      const container = thumbnailContainerRef.current
      const activeThumb = container.children[currentImageIndex] as HTMLElement
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentImageIndex])

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

  // Handle calculator interaction
  const handleCalculatorChange = () => {
    if (onCalculatorInteraction) {
      onCalculatorInteraction()
    }
  }

  // Inspection points
  const inspectionPoints = useMemo(() => {
    if (!inspectionData?.inspection_points) return []
    return Object.values(inspectionData.inspection_points)
      .map(p => p[0])
      .filter(Boolean)
  }, [inspectionData])

  const hasPromotion = vehicle.promociones && vehicle.promociones.length > 0
  const sucursal = vehicle.sucursal?.[0] || 'Monterrey'

  // Description handling
  const description = vehicle.descripcion || vehicle.description || ''

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Main Grid: Content + Sticky Sidebar */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">

            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">

              {/* Image Gallery Section */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Main Image with Navigation Arrows - Swipeable */}
                <motion.div
                  className="relative overflow-hidden aspect-[16/10] cursor-grab active:cursor-grabbing group bg-gray-100"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentImageIndex}
                      src={allImages[currentImageIndex]}
                      alt={`${vehicle.title} - Imagen ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        if (!isDragging) setIsLightboxOpen(true)
                      }}
                    />
                  </AnimatePresence>

                  {/* Expand/Lightbox button */}
                  <button
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-3 transition-all opacity-0 group-hover:opacity-100 z-20"
                    aria-label="Ver en pantalla completa"
                  >
                    <ZoomInIcon className="w-5 h-5" />
                  </button>

                  {/* Navigation Arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToPrevImage() }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all hover:scale-105 opacity-0 group-hover:opacity-100 z-20"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToNextImage() }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all hover:scale-105 opacity-0 group-hover:opacity-100 z-20"
                        aria-label="Siguiente imagen"
                      >
                        <ChevronRightIcon className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm font-semibold px-3 py-1.5 rounded-full z-10">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>

                  {/* Swipe hint on mobile */}
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-1.5 rounded-full z-10 sm:hidden">
                    ← Desliza →
                  </div>
                </motion.div>

                {/* Thumbnail Slider */}
                {allImages.length > 1 && (
                  <div
                    ref={thumbnailContainerRef}
                    className="flex gap-2 p-3 overflow-x-auto scroll-smooth snap-x snap-mandatory bg-gray-50"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToImage(idx)}
                        className={cn(
                          'shrink-0 w-20 sm:w-24 aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all snap-start',
                          currentImageIndex === idx
                            ? 'border-orange-500 ring-2 ring-orange-200 scale-105'
                            : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                        )}
                      >
                        <img
                          src={img}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Title & Key Info - Mobile Only */}
              <div className="lg:hidden space-y-4">
                {/* Title */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {hasPromotion && (
                          <Badge className="mb-2 bg-green-500 text-white border-none">
                            <SparklesIcon className="w-3 h-3 mr-1" />
                            Promoción
                          </Badge>
                        )}
                        <h1 className="text-2xl font-black text-gray-900 leading-tight">
                          {vehicle.autoano || vehicle.year} {vehicle.marca} {vehicle.modelo}
                        </h1>
                        <p className="text-base text-muted-foreground font-medium mt-1">
                          {vehicle.version || vehicle.title?.split(' ').slice(3).join(' ')}
                        </p>
                      </div>
                      <button
                        onClick={onFavoriteClick}
                        className={cn(
                          'p-2.5 rounded-full border-2 transition-all',
                          isFavorite
                            ? 'bg-red-50 border-red-200 text-red-500'
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'
                        )}
                      >
                        <HeartIcon className={cn('w-6 h-6', isFavorite && 'fill-current')} />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="pt-3 border-t">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-orange-600">
                          {formatPrice(hasPromotion && vehicle.precio_reduccion ? vehicle.precio_reduccion : vehicle.precio)}
                        </span>
                        {hasPromotion && vehicle.precio_reduccion && vehicle.precio_reduccion < vehicle.precio && (
                          <span className="text-lg text-muted-foreground line-through">
                            {formatPrice(vehicle.precio)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Desde <span className="font-bold text-gray-900">{formatPrice(financeData.monthlyPayment)}</span>/mes con financiamiento
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile CTAs */}
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 text-base"
                    onClick={onFinancingClick}
                  >
                    <CreditCardIcon className="w-5 h-5 mr-2" />
                    Financiar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-bold h-14 text-base"
                    onClick={onWhatsAppClick}
                  >
                    <MessageCircleIcon className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Key Highlights Grid */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Datos Clave</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 divide-y sm:divide-y-0">
                  {vehicle.kilometraje && (
                    <KeyHighlight
                      icon={GaugeIcon}
                      label="Kilometraje"
                      value={formatMileage(vehicle.kilometraje)}
                    />
                  )}
                  {vehicle.transmision && (
                    <KeyHighlight
                      icon={CogIcon}
                      label="Transmisión"
                      value={vehicle.transmision}
                    />
                  )}
                  {vehicle.combustible && (
                    <KeyHighlight
                      icon={FuelIcon}
                      label="Combustible"
                      value={vehicle.combustible}
                    />
                  )}
                  {vehicle.color_exterior && (
                    <KeyHighlight
                      icon={PaletteIcon}
                      label="Color Exterior"
                      value={vehicle.color_exterior}
                    />
                  )}
                  {vehicle.color_interior && (
                    <KeyHighlight
                      icon={CircleDotIcon}
                      label="Color Interior"
                      value={vehicle.color_interior}
                    />
                  )}
                  {(vehicle.motor || vehicle.automotor) && (
                    <KeyHighlight
                      icon={Settings2Icon}
                      label="Motor"
                      value={vehicle.motor || vehicle.automotor || ''}
                    />
                  )}
                </div>
              </div>

              {/* Purchase Options Cards */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Opciones de Compra</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Cash */}
                  <button
                    onClick={onWhatsAppClick}
                    className="group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <BanknoteIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">Contado</h3>
                        <p className="text-xs text-muted-foreground">Asesoría profesional</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 group-hover:gap-2 transition-all">
                      Iniciar chat <ChevronRightIcon className="w-4 h-4" />
                    </span>
                  </button>

                  {/* Finance */}
                  <button
                    onClick={onFinancingClick}
                    className="group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <CreditCardIcon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">Crédito</h3>
                        <p className="text-xs text-muted-foreground">100% en línea</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 group-hover:gap-2 transition-all">
                      Iniciar trámite <ChevronRightIcon className="w-4 h-4" />
                    </span>
                  </button>

                  {/* Branch */}
                  <button
                    onClick={onWhatsAppClick}
                    className="group text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <BuildingIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900">Sucursal</h3>
                        <p className="text-xs text-muted-foreground">{sucursal}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                      Agendar cita <ChevronRightIcon className="w-4 h-4" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Accordion Sections */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <Accordion type="single" collapsible className="w-full" defaultValue="specs">
                  {/* Specifications */}
                  <AccordionItem value="specs" className="border-b">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <CarIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-bold text-gray-900">Especificaciones</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      <dl className="grid grid-cols-2 gap-4">
                        {vehicle.marca && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Marca</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.marca}</dd>
                          </div>
                        )}
                        {vehicle.modelo && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Modelo</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.modelo}</dd>
                          </div>
                        )}
                        {vehicle.autoano && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Año</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.autoano}</dd>
                          </div>
                        )}
                        {vehicle.kilometraje && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Kilometraje</dt>
                            <dd className="font-semibold text-gray-900">{formatMileage(vehicle.kilometraje)}</dd>
                          </div>
                        )}
                        {vehicle.transmision && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Transmisión</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.transmision}</dd>
                          </div>
                        )}
                        {vehicle.combustible && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Combustible</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.combustible}</dd>
                          </div>
                        )}
                        {(vehicle.motor || vehicle.automotor) && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Motor</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.motor || vehicle.automotor}</dd>
                          </div>
                        )}
                        {(vehicle.cilindros || vehicle.autocilindros) && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Cilindros</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.cilindros || vehicle.autocilindros}</dd>
                          </div>
                        )}
                        {vehicle.color_exterior && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Color Exterior</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.color_exterior}</dd>
                          </div>
                        )}
                        {vehicle.color_interior && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Color Interior</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.color_interior}</dd>
                          </div>
                        )}
                        {vehicle.clasificacionid?.[0] && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Carrocería</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.clasificacionid[0]}</dd>
                          </div>
                        )}
                        {vehicle.nosiniestros && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Siniestros</dt>
                            <dd className="font-semibold text-gray-900">{vehicle.nosiniestros}</dd>
                          </div>
                        )}
                      </dl>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Calculator */}
                  <AccordionItem value="calculator" className="border-b">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <WalletIcon className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-bold text-gray-900">Calculadora de Pagos</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label htmlFor="downPayment" className="text-sm font-semibold text-gray-700">
                              Enganche
                            </label>
                            <span className="text-lg font-black text-orange-600">{formatPrice(downPayment)}</span>
                          </div>
                          <input
                            id="downPayment"
                            type="range"
                            min={financeData.minDownPayment}
                            max={financeData.maxDownPayment}
                            step="5000"
                            value={downPayment}
                            onChange={e => {
                              setDownPayment(Number(e.target.value))
                              handleCalculatorChange()
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>{formatPrice(financeData.minDownPayment)} (25%)</span>
                            <span>{formatPrice(financeData.maxDownPayment)} (70%)</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-3">
                            Plazo (meses)
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {financeData.loanTerms.map((term: number) => (
                              <button
                                key={term}
                                onClick={() => {
                                  setLoanTerm(term)
                                  handleCalculatorChange()
                                }}
                                className={cn(
                                  'px-3 py-2.5 text-sm font-bold rounded-lg transition-all',
                                  loanTerm === term
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                              >
                                {term} meses
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-orange-800 font-medium">Mensualidad estimada</p>
                              <p className="text-xs text-orange-600 mt-0.5">Tasa de 12.99%* (puede variar)</p>
                            </div>
                            <span className="text-3xl font-black text-orange-600">{formatPrice(financeData.monthlyPayment)}</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground text-center">
                          *La tasa de interés puede variar según el banco y tu perfil crediticio. Incluye seguro (5% del valor).
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Vehicle History/Inspection */}
                  <AccordionItem value="inspection" className="border-b-0">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-bold text-gray-900">Inspección y Garantía</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      {inspectionLoading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mx-auto"></div>
                          <p className="text-sm text-muted-foreground mt-2">Cargando inspección...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Warranty Badge */}
                          {vehicle.garantia && (
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-green-800">Garantía TREFA Incluida</h4>
                                  <p className="text-xs text-green-700 mt-1">{vehicle.garantia}</p>
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">
                                      <WrenchIcon className="w-3 h-3 mr-1" />
                                      Motor y transmisión
                                    </Badge>
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">
                                      <CalendarIcon className="w-3 h-3 mr-1" />
                                      Cobertura limitada
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Inspection Points */}
                          {inspectionPoints.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm text-gray-900">Puntos de Inspección</h4>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {inspectionPoints.slice(0, 8).map((point, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-gray-50 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Reporte de inspección detallado no disponible.
                              </p>
                            </div>
                          )}

                          {/* Owner History */}
                          <div className="flex items-center gap-3 pt-3 border-t">
                            <UsersIcon className="w-5 h-5 text-blue-500" />
                            <span className="text-sm text-gray-700">
                              <span className="font-bold">{inspectionData?.past_owners || 1} dueño{(inspectionData?.past_owners || 1) > 1 ? 's' : ''}</span> anterior{(inspectionData?.past_owners || 1) > 1 ? 'es' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Description */}
              {description && (
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Descripción</h2>
                  <div
                    className="prose prose-xs max-w-none text-gray-600 text-sm prose-headings:text-sm prose-headings:font-semibold prose-headings:text-gray-900 prose-strong:text-gray-900 prose-p:leading-relaxed prose-p:text-sm"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Sticky Sidebar (Desktop) */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                {/* Price & Title Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {hasPromotion && (
                        <Badge className="bg-green-500 text-white border-none px-3 py-1">
                          <SparklesIcon className="w-3 h-3 mr-1" />
                          Promoción
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-gray-200 text-gray-600 px-3 py-1">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        {sucursal}
                      </Badge>
                    </div>

                    {/* Title */}
                    <div>
                      <h1 className="text-2xl font-black text-gray-900 leading-tight">
                        {vehicle.autoano || vehicle.year} {vehicle.marca} {vehicle.modelo}
                      </h1>
                      <p className="text-base text-muted-foreground font-medium mt-1">
                        {vehicle.version || vehicle.title?.split(' ').slice(3).join(' ')}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="pt-4 border-t">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-orange-600">
                          {formatPrice(hasPromotion && vehicle.precio_reduccion ? vehicle.precio_reduccion : vehicle.precio)}
                        </span>
                      </div>
                      {hasPromotion && vehicle.precio_reduccion && vehicle.precio_reduccion < vehicle.precio && (
                        <span className="text-base text-muted-foreground line-through">
                          {formatPrice(vehicle.precio)}
                        </span>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        Desde <span className="font-bold text-gray-900">{formatPrice(financeData.monthlyPayment)}</span>/mes
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <EyeIcon className="w-4 h-4" />
                        {(vehicle.view_count || 0).toLocaleString('es-MX')} vistas
                      </span>
                      <span className="flex items-center gap-1">
                        <HeartIcon className="w-4 h-4" />
                        {favoriteCount} favoritos
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 text-base shadow-lg shadow-orange-200"
                    onClick={onFinancingClick}
                    data-gtm-id="detail-page-finance"
                  >
                    <CreditCardIcon className="mr-2 w-5 h-5" />
                    Comprar con Financiamiento
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-bold h-14 text-base"
                    onClick={onWhatsAppClick}
                  >
                    <MessageCircleIcon className="mr-2 w-5 h-5" />
                    Contactar por WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-gray-200 hover:border-gray-300 font-bold h-12"
                    onClick={onFavoriteClick}
                    data-gtm-id="detail-page-favorite"
                  >
                    <HeartIcon className={cn('mr-2 w-5 h-5', isFavorite && 'fill-red-500 text-red-500')} />
                    {isFavorite ? 'Guardado en favoritos' : 'Guardar en favoritos'}
                  </Button>
                </div>

                {/* Trust Badges Card */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-orange-500" />
                    ¿Por qué TREFA?
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm">
                      <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><span className="font-semibold">Garantía mecánica</span> en motor y transmisión</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><span className="font-semibold">150 puntos</span> de inspección certificada</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><span className="font-semibold">Kit de seguridad</span> incluido (garantía + recompra)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                      <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span><span className="font-semibold">Financiamiento</span> 100% digital, respuesta en 24hrs</span>
                    </li>
                  </ul>
                  <Link
                    href="/kit-trefa"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 mt-4"
                  >
                    Conoce el Kit TREFA <ChevronRightIcon className="w-4 h-4" />
                  </Link>
                </div>

                {/* Branch/Schedule Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <BuildingIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">Sucursal {sucursal}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Agenda una cita para ver este auto en persona
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={onWhatsAppClick}
                      >
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Agendar Cita
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          media={lightboxMedia}
          currentIndex={currentImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={goToPrevImage}
          onNext={goToNextImage}
          setCurrentIndex={setCurrentImageIndex}
        />
      )}
    </>
  )
}

export default VehicleProductOverview
