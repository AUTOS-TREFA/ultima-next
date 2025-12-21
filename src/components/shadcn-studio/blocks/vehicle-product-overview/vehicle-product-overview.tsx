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
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/constants'
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
  isSold?: boolean  // Hide action buttons for sold/historic vehicles
}

// Lightbox Component - Enhanced with better controls and visibility
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
  const [showControls, setShowControls] = useState(true)
  const ZOOM_LEVEL = 3

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Auto-hide controls after 3 seconds of inactivity
    let hideTimeout: NodeJS.Timeout
    const resetHideTimeout = () => {
      setShowControls(true)
      clearTimeout(hideTimeout)
      hideTimeout = setTimeout(() => setShowControls(false), 3000)
    }

    window.addEventListener('mousemove', resetHideTimeout)
    window.addEventListener('touchstart', resetHideTimeout)
    resetHideTimeout()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', resetHideTimeout)
      window.removeEventListener('touchstart', resetHideTimeout)
      clearTimeout(hideTimeout)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, onPrev, onNext])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    // Use clientX/Y (viewport-relative) since getBoundingClientRect() returns viewport-relative coordinates
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    // Clamp values between 0 and 100
    setMousePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    })
  }

  const currentItem = media[currentIndex]
  if (!currentItem) return null

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: 'none'
      }}
    >
      {/* Top bar with counter and close button */}
      <div
        className="fixed top-0 left-0 right-0 z-[10002] flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        {/* Counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
          <span className="font-bold">{currentIndex + 1}</span>
          <span className="text-white/60">/</span>
          <span>{media.length}</span>
        </div>

        {/* Close button - Large touch target for mobile */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] px-3 sm:px-4 py-2 bg-white text-foreground font-semibold rounded-full shadow-lg active:bg-gray-200 transition-colors"
          aria-label="Cerrar galería"
          type="button"
        >
          <XIcon className="w-5 h-5" />
          <span className="hidden sm:inline sm:ml-2">Cerrar</span>
        </button>
      </div>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[10000] p-2 sm:p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all active:scale-95"
            aria-label="Imagen anterior"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext() }}
            className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[10000] p-2 sm:p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all active:scale-95"
            aria-label="Siguiente imagen"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main image content - Centered */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          paddingTop: 'max(60px, calc(env(safe-area-inset-top) + 48px))',
          paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom) + 80px))',
          paddingLeft: '48px',
          paddingRight: '48px'
        }}
        onClick={onClose}
      >
        {currentItem.type === 'image' && (
          <div
            className="relative w-full h-full flex items-center justify-center"
            onMouseEnter={() => setShowZoom(true)}
            onMouseLeave={() => setShowZoom(false)}
            onMouseMove={handleMouseMove}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentItem.url}
              alt={`Imagen ${currentIndex + 1} de ${media.length}`}
              className="max-w-full max-h-full object-contain rounded-md"
              draggable={false}
              style={{ maxHeight: 'calc(100vh - 180px)' }}
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE; }}
            />
            {showZoom && (
              <div
                className="absolute pointer-events-none w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-white/80 bg-no-repeat shadow-2xl hidden sm:block"
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

      {/* Bottom thumbnails */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-gradient-to-t from-black/90 to-transparent py-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center px-3">
          <div className="flex gap-1.5 p-1.5 bg-black/60 rounded-lg backdrop-blur-sm overflow-x-auto max-w-full">
            {media.map((item, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                className={cn(
                  'shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded overflow-hidden border-2 transition-all',
                  currentIndex === idx
                    ? 'border-white scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <img src={item.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE; }} />
              </button>
            ))}
          </div>
        </div>

        {/* Mobile swipe hint */}
        <div className="sm:hidden flex justify-center mt-2 text-white/50 text-xs">
          <span className="flex items-center gap-1">
            <ChevronLeftIcon className="w-3 h-3" />
            Desliza
            <ChevronRightIcon className="w-3 h-3" />
          </span>
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
  inspectionLoading = false,
  isSold = false
}: VehicleProductOverviewProps) => {
  const id = useId()

  // State
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [downPayment, setDownPayment] = useState(0)
  const [loanTerm, setLoanTerm] = useState(48)
  const thumbnailContainerRef = useRef<HTMLDivElement>(null)

  // Action button visibility - hide for sold/historic vehicles and separado
  const isSeparado = vehicle.separado === true || vehicle.separado === 'true'
  const showFinancingButton = !isSold && !isSeparado
  const showWhatsAppButton = !isSold  // WhatsApp visible even if separado, but not if sold
  const showActionButtons = showFinancingButton || showWhatsAppButton

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
      <div className="bg-muted/30 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Main Grid: Content + Sticky Sidebar */}
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">

            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">

              {/* Image Gallery Section */}
              <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border">
                {/* Main Image with Navigation Arrows - Swipeable */}
                <motion.div
                  className="relative overflow-hidden aspect-[16/10] cursor-grab active:cursor-grabbing group bg-muted"
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-foreground rounded-full p-3 shadow-lg transition-all hover:scale-105 opacity-0 group-hover:opacity-100 z-20"
                        aria-label="Imagen anterior"
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToNextImage() }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-foreground rounded-full p-3 shadow-lg transition-all hover:scale-105 opacity-0 group-hover:opacity-100 z-20"
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
                    className="flex gap-2 p-3 overflow-x-auto scroll-smooth snap-x snap-mandatory bg-muted/50"
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
                            : 'border-transparent hover:border-border opacity-70 hover:opacity-100'
                        )}
                      >
                        <img
                          src={img}
                          alt={`Miniatura ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE; }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Title & Key Info - Mobile Only */}
              <div className="lg:hidden space-y-4">
                {/* Title */}
                <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {hasPromotion && (
                          <Badge className="mb-2 bg-green-500 text-white border-none">
                            <SparklesIcon className="w-3 h-3 mr-1" />
                            Promoción
                          </Badge>
                        )}
                        <h1 className="text-xl sm:text-2xl font-black text-foreground leading-snug line-clamp-2">
                          {vehicle.autoano || vehicle.year} {vehicle.marca} {vehicle.modelo} {vehicle.version && <span className="font-semibold text-muted-foreground">{vehicle.version}</span>}
                        </h1>
                      </div>
                      <button
                        onClick={onFavoriteClick}
                        className={cn(
                          'p-2 rounded-full border-2 transition-all shrink-0',
                          isFavorite
                            ? 'bg-red-50 border-red-400 text-red-500'
                            : 'bg-white border-red-300 text-red-400 hover:text-red-500 hover:border-red-400'
                        )}
                      >
                        <HeartIcon className={cn('w-5 h-5', isFavorite && 'fill-current')} />
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
                        Desde <span className="font-bold text-foreground">{formatPrice(financeData.monthlyPayment)}</span>/mes con financiamiento
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile CTAs - Hidden for sold vehicles */}
                {showActionButtons && (
                  <div className="flex gap-2">
                    {showFinancingButton && (
                      <Button
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold h-11 text-sm"
                        onClick={onFinancingClick}
                      >
                        <CreditCardIcon className="w-4 h-4 mr-1.5" />
                        Financiar
                      </Button>
                    )}
                    {showWhatsAppButton && (
                      <Button
                        variant="outline"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-semibold h-11 text-sm"
                        onClick={onWhatsAppClick}
                      >
                        <MessageCircleIcon className="w-4 h-4 mr-1.5" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Key Highlights Grid */}
              <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                <h2 className="text-base font-semibold text-foreground mb-4">Datos Clave</h2>
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

              {/* Purchase Options Cards - Hidden for sold vehicles */}
              {showActionButtons && (
                <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <h2 className="text-base font-semibold text-foreground mb-4">Opciones de Compra</h2>
                  <div className={`grid gap-3 ${showFinancingButton ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    {/* Cash */}
                    {showWhatsAppButton && (
                      <button
                        onClick={onWhatsAppClick}
                        className="group text-left p-4 rounded-xl border-2 border-border hover:border-green-400 hover:bg-green-50 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <BanknoteIcon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">Contado</h3>
                            <p className="text-xs text-muted-foreground">Asesoría profesional</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 group-hover:gap-2 transition-all">
                          Iniciar chat <ChevronRightIcon className="w-4 h-4" />
                        </span>
                      </button>
                    )}

                    {/* Finance - Hidden for separado vehicles */}
                    {showFinancingButton && (
                      <button
                        onClick={onFinancingClick}
                        className="group text-left p-4 rounded-xl border-2 border-border hover:border-orange-400 hover:bg-orange-50 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <CreditCardIcon className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">Crédito</h3>
                            <p className="text-xs text-muted-foreground">100% en línea</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 group-hover:gap-2 transition-all">
                          Iniciar trámite <ChevronRightIcon className="w-4 h-4" />
                        </span>
                      </button>
                    )}

                    {/* Branch */}
                    {showWhatsAppButton && (
                      <button
                        onClick={onWhatsAppClick}
                        className="group text-left p-4 rounded-xl border-2 border-border hover:border-blue-400 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <BuildingIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-foreground">Sucursal</h3>
                            <p className="text-xs text-muted-foreground">{sucursal}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                          Agendar cita <ChevronRightIcon className="w-4 h-4" />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Accordion Sections */}
              <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border">
                <Accordion type="single" collapsible className="w-full" defaultValue="specs">
                  {/* Specifications */}
                  <AccordionItem value="specs" className="border-b">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <CarIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="font-bold text-foreground">Especificaciones</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      <dl className="grid grid-cols-2 gap-4">
                        {vehicle.marca && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Marca</dt>
                            <dd className="font-semibold text-foreground">{vehicle.marca}</dd>
                          </div>
                        )}
                        {vehicle.modelo && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Modelo</dt>
                            <dd className="font-semibold text-foreground">{vehicle.modelo}</dd>
                          </div>
                        )}
                        {vehicle.autoano && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Año</dt>
                            <dd className="font-semibold text-foreground">{vehicle.autoano}</dd>
                          </div>
                        )}
                        {vehicle.kilometraje && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Kilometraje</dt>
                            <dd className="font-semibold text-foreground">{formatMileage(vehicle.kilometraje)}</dd>
                          </div>
                        )}
                        {vehicle.transmision && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Transmisión</dt>
                            <dd className="font-semibold text-foreground">{vehicle.transmision}</dd>
                          </div>
                        )}
                        {vehicle.combustible && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Combustible</dt>
                            <dd className="font-semibold text-foreground">{vehicle.combustible}</dd>
                          </div>
                        )}
                        {(vehicle.motor || vehicle.automotor) && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Motor</dt>
                            <dd className="font-semibold text-foreground">{vehicle.motor || vehicle.automotor}</dd>
                          </div>
                        )}
                        {(vehicle.cilindros || vehicle.autocilindros) && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Cilindros</dt>
                            <dd className="font-semibold text-foreground">{vehicle.cilindros || vehicle.autocilindros}</dd>
                          </div>
                        )}
                        {vehicle.color_exterior && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Color Exterior</dt>
                            <dd className="font-semibold text-foreground">{vehicle.color_exterior}</dd>
                          </div>
                        )}
                        {vehicle.color_interior && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Color Interior</dt>
                            <dd className="font-semibold text-foreground">{vehicle.color_interior}</dd>
                          </div>
                        )}
                        {vehicle.clasificacionid?.[0] && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Carrocería</dt>
                            <dd className="font-semibold text-foreground">{vehicle.clasificacionid[0]}</dd>
                          </div>
                        )}
                        {vehicle.nosiniestros && (
                          <div className="space-y-1">
                            <dt className="text-xs text-muted-foreground uppercase tracking-wide">Siniestros</dt>
                            <dd className="font-semibold text-foreground">{vehicle.nosiniestros}</dd>
                          </div>
                        )}
                      </dl>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Calculator */}
                  <AccordionItem value="calculator" className="border-b">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <WalletIcon className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="font-bold text-foreground">Calculadora de Pagos</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <label htmlFor="downPayment" className="text-sm font-semibold text-foreground">
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
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>{formatPrice(financeData.minDownPayment)} (25%)</span>
                            <span>{formatPrice(financeData.maxDownPayment)} (70%)</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-foreground block mb-3">
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
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                    <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-bold text-foreground">Inspección y Garantía</span>
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
                              <h4 className="font-semibold text-sm text-foreground">Puntos de Inspección</h4>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {inspectionPoints.slice(0, 8).map((point, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-foreground">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <div className="text-center py-4 bg-muted/50 rounded-lg">
                              <p className="text-sm text-muted-foreground">
                                Reporte de inspección detallado no disponible.
                              </p>
                            </div>
                          )}

                          {/* Owner History */}
                          <div className="flex items-center gap-3 pt-3 border-t">
                            <UsersIcon className="w-5 h-5 text-blue-500" />
                            <span className="text-sm text-foreground">
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
                <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <h2 className="text-base font-semibold text-foreground mb-3">Descripción</h2>
                  <div
                    className="prose prose-xs max-w-none text-muted-foreground text-sm prose-headings:text-sm prose-headings:font-semibold prose-headings:text-foreground prose-strong:text-foreground prose-p:leading-relaxed prose-p:text-sm"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Sticky Sidebar (Desktop) */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-24 space-y-4">
                {/* Price & Title Card */}
                <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <div className="space-y-4">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {hasPromotion && (
                        <Badge className="bg-green-500 text-white border-none px-3 py-1">
                          <SparklesIcon className="w-3 h-3 mr-1" />
                          Promoción
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-border text-muted-foreground px-3 py-1">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        {sucursal}
                      </Badge>
                    </div>

                    {/* Title */}
                    <div>
                      <h1 className="text-2xl font-black text-foreground leading-tight">
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
                        Desde <span className="font-bold text-foreground">{formatPrice(financeData.monthlyPayment)}</span>/mes
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

                {/* CTA Buttons Card - Hidden for sold vehicles */}
                <div className="bg-card rounded-xl p-5 shadow-sm border border-border space-y-3">
                  {showFinancingButton && (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-14 text-base shadow-lg shadow-orange-200"
                      onClick={onFinancingClick}
                      data-gtm-id="detail-page-finance"
                    >
                      <CreditCardIcon className="mr-2 w-5 h-5" />
                      Comprar con Financiamiento
                    </Button>
                  )}
                  {showWhatsAppButton && (
                    <Button
                      variant="outline"
                      className="w-full bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 font-bold h-14 text-base"
                      onClick={onWhatsAppClick}
                    >
                      <MessageCircleIcon className="mr-2 w-5 h-5" />
                      Contactar por WhatsApp
                    </Button>
                  )}
                  {!isSold && (
                    <Button
                      variant="outline"
                      className="w-full border-2 border-border hover:border-border/80 font-bold h-12"
                      onClick={onFavoriteClick}
                      data-gtm-id="detail-page-favorite"
                    >
                      <HeartIcon className={cn('mr-2 w-5 h-5', isFavorite && 'fill-red-500 text-red-500')} />
                      {isFavorite ? 'Guardado en favoritos' : 'Guardar en favoritos'}
                    </Button>
                  )}
                </div>

                {/* Trust Badges Card */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100">
                  <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
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
                <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <BuildingIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-foreground">Sucursal {sucursal}</h4>
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

      {/* Mobile Sticky CTA Footer - Hidden for sold vehicles */}
      {showActionButtons && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-border/40"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="px-4 py-2.5 flex items-center gap-3">
            {/* Price - left side */}
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-foreground leading-tight">
                {formatPrice(hasPromotion && vehicle.precio_reduccion ? vehicle.precio_reduccion : vehicle.precio)}
              </p>
              <p className="text-xs text-muted-foreground">
                Desde <span className="font-semibold text-orange-600">{formatPrice(financeData.monthlyPayment)}</span>/mes
              </p>
            </div>

            {/* CTA Buttons - right side */}
            <div className="flex items-center gap-2">
              {showWhatsAppButton && (
                <Button
                  size="icon"
                  className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white shrink-0"
                  onClick={onWhatsAppClick}
                  aria-label="Contactar por WhatsApp"
                >
                  <MessageCircleIcon className="w-5 h-5" />
                </Button>
              )}
              {showFinancingButton && (
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold h-10 px-5 text-sm rounded-full"
                  onClick={onFinancingClick}
                >
                  Financiar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spacer for mobile sticky footer (CTA ~70px + safe area) */}
      {showActionButtons && <div className="lg:hidden h-24" />}
    </>
  )
}

export default VehicleProductOverview
