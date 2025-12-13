'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Shield, MapPin, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { branchData } from '@/utils/constants'

// Transform branchData for display in tooltips + add the new Lindavista branch
const branches = [
  ...branchData.map((branch) => ({
    name: `TREFA ${branch.city}`,
    city: branch.city,
    address: branch.address,
    directionsUrl: branch.directionsUrl,
  })),
  {
    name: 'TREFA Lindavista',
    city: 'Guadalupe',
    address: 'Blvd. Ruiz Cortinez, Col. Lindavista, Guadalupe, NL',
    directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=TREFA+Lindavista+Blvd+Ruiz+Cortines+Guadalupe+NL',
  },
]

const guarantees = [
  {
    title: 'Garantía Mecánica',
    description: '6 meses de garantía en motor y transmisión',
    icon: '🔧',
  },
  {
    title: 'Inspección 150 Puntos',
    description: 'Revisión exhaustiva antes de entrega',
    icon: '✅',
  },
  {
    title: 'Kit de Seguridad',
    description: 'GPS, seguros y asistencia vial incluidos',
    icon: '🛡️',
  },
  {
    title: 'Satisfacción Garantizada',
    description: '7 días para cambio si no estás satisfecho',
    icon: '💯',
  },
]

const reviews = [
  {
    name: 'Carlos M.',
    rating: 5,
    text: 'Excelente servicio, me ayudaron en todo el proceso',
    source: 'Google',
  },
  {
    name: 'María L.',
    rating: 5,
    text: 'La mejor experiencia comprando un auto seminuevo',
    source: 'Google',
  },
  {
    name: 'Roberto G.',
    rating: 5,
    text: 'Muy profesionales y transparentes en todo momento',
    source: 'Google',
  },
]

// Shining button component with trace effect
const ShiningButton = ({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode
  className: string
  delay?: number
}) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`${className} relative overflow-hidden`}
  >
    {children}
    {/* Shining trace effect */}
    <motion.span
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
      initial={{ x: '-100%' }}
      whileInView={{ x: '200%' }}
      viewport={{ once: true }}
      transition={{
        duration: 1.2,
        delay: delay + 0.5,
        ease: 'easeInOut'
      }}
    />
  </motion.button>
)

export default function ValuePropositionStatement() {
  return (
    <section className="bg-white py-20 sm:py-28 lg:py-36 border-b border-neutral-100 flex items-center min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Statement */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <p className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-800" style={{ lineHeight: '2.0' }}>
            Somos la agencia de autos seminuevos de servicio personalizado{' '}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShiningButton
                    className="inline-flex items-center gap-2.5 px-3 py-0.5 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors duration-200 border border-amber-200 group"
                    delay={0.2}
                  >
                    <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-amber-700 text-2xl sm:text-3xl lg:text-4xl">mejor calificada</span>
                  </ShiningButton>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="w-80 p-0 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden"
                  sideOffset={8}
                >
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-2xl">4.9</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-4 h-4 text-white fill-white" />
                        ))}
                      </div>
                    </div>
                    <p className="text-white/80 text-xs mt-1">+500 reseñas verificadas</p>
                  </div>
                  <div className="p-2">
                    {reviews.map((review, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-neutral-900">{review.name}</span>
                          <div className="flex gap-0.5">
                            {[...Array(review.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-neutral-500">&ldquo;{review.text}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="https://www.google.com/maps/place/TREFA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-4 py-3 bg-neutral-50 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors border-t border-neutral-100"
                  >
                    Ver todas las reseñas
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>{' '}
            del país por nuestras{' '}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShiningButton
                    className="inline-flex items-center gap-2.5 px-3 py-0.5 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors duration-200 border border-emerald-200 group"
                    delay={0.4}
                  >
                    <Shield className="w-7 h-7 text-emerald-600" />
                    <span className="font-bold text-emerald-700 text-2xl sm:text-3xl lg:text-4xl">garantías únicas en su clase</span>
                  </ShiningButton>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="w-80 p-0 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden"
                  sideOffset={8}
                >
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
                    <p className="text-white font-semibold text-sm">Garantías TREFA</p>
                    <p className="text-white/80 text-xs mt-0.5">Protección real para tu compra</p>
                  </div>
                  <div className="p-2">
                    {guarantees.map((guarantee, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <span className="text-xl">{guarantee.icon}</span>
                        <div>
                          <p className="font-medium text-sm text-neutral-900">{guarantee.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{guarantee.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/kit-trefa"
                    className="flex items-center justify-center gap-1 px-4 py-3 bg-neutral-50 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors border-t border-neutral-100"
                  >
                    Conoce el Kit TREFA
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            , ahora con{' '}
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ShiningButton
                    className="inline-flex items-center gap-2.5 px-3 py-0.5 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-200 border border-blue-200 group"
                    delay={0.6}
                  >
                    <MapPin className="w-7 h-7 text-blue-600" />
                    <span className="font-bold text-blue-700 text-2xl sm:text-3xl lg:text-4xl">5 sucursales</span>
                  </ShiningButton>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="w-80 p-0 bg-white rounded-xl shadow-2xl border border-neutral-100 overflow-hidden"
                  sideOffset={8}
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
                    <p className="text-white font-semibold text-sm">Nuestras Sucursales</p>
                    <p className="text-white/80 text-xs mt-0.5">Visítanos y conoce tu próximo auto</p>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {branches.map((branch, idx) => (
                      <Link
                        key={idx}
                        href={branch.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-neutral-900 group-hover:text-blue-700 transition-colors">
                            {branch.name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">{branch.address}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/contacto"
                    className="flex items-center justify-center gap-1 px-4 py-3 bg-neutral-50 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors border-t border-neutral-100"
                  >
                    Ver todas las ubicaciones
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>{' '}
            para estar más cerca de ti.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
