'use client'

import Link from 'next/link'
import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const LOGO_URL = 'https://trefa.mx/images/logoblanco.png'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Logo and Description */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" aria-label="TREFA - Inicio">
              <img
                src={LOGO_URL}
                alt="TREFA - Autos Seminuevos"
                className="h-16 w-auto"
                loading="lazy"
              />
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              La agencia de autos seminuevos mejor calificada del país. Financiamiento a tu medida, garantías únicas en su clase y 5 sucursales para estar más cerca de ti.
            </p>
            <Separator className="bg-gray-700" />
            <div className="flex items-center gap-4">
              <a
                href="https://facebook.com/autostrefamx"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="https://instagram.com/autostrefamx"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-400 hover:text-[#E4405F] transition-colors"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="https://linkedin.com/company/autostrefamx"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-gray-400 hover:text-[#0A66C2] transition-colors"
              >
                <Linkedin className="size-5" />
              </a>
              <a
                href="https://maps.app.goo.gl/qRWitFgU7Hy7zEWw9"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Google Maps"
                className="text-gray-400 hover:text-[#4285F4] transition-colors"
              >
                <MapPin className="size-5" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {/* Acceso Rápido */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Acceso Rápido
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/autos" className="text-gray-400 hover:text-white transition-colors">
                    Inventario
                  </Link>
                </li>
                <li>
                  <Link href="/registro" className="text-gray-400 hover:text-white transition-colors">
                    Registro
                  </Link>
                </li>
                <li>
                  <Link href="/promociones" className="text-gray-400 hover:text-white transition-colors">
                    Promociones
                  </Link>
                </li>
                <li>
                  <Link href="/kit-trefa" className="text-gray-400 hover:text-white transition-colors">
                    Kit TREFA
                  </Link>
                </li>
                <li>
                  <Link href="/vender-mi-auto" className="text-gray-400 hover:text-white transition-colors">
                    Vender mi Auto
                  </Link>
                </li>
              </ul>
            </div>

            {/* Financiamientos */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Financiamientos
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/registro" className="text-gray-400 hover:text-white transition-colors">
                    Crear mi cuenta
                  </Link>
                </li>
                <li>
                  <Link href="/escritorio/aplicacion" className="text-gray-400 hover:text-white transition-colors">
                    Solicitar crédito
                  </Link>
                </li>
                <li>
                  <Link href="/perfilacion-bancaria" className="text-gray-400 hover:text-white transition-colors">
                    Perfilamiento bancario
                  </Link>
                </li>
                <li>
                  <Link href="/politica-de-privacidad" className="text-gray-400 hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/proteccion-de-datos" className="text-gray-400 hover:text-white transition-colors">
                    Protección de Datos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Carrocerías - SEO */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Carrocerías
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/carroceria/suv" className="text-gray-400 hover:text-white transition-colors">
                    SUVs
                  </Link>
                </li>
                <li>
                  <Link href="/carroceria/sedan" className="text-gray-400 hover:text-white transition-colors">
                    Sedanes
                  </Link>
                </li>
                <li>
                  <Link href="/carroceria/hatchback" className="text-gray-400 hover:text-white transition-colors">
                    Hatchback
                  </Link>
                </li>
                <li>
                  <Link href="/carroceria/pick-up" className="text-gray-400 hover:text-white transition-colors">
                    Pick-Ups
                  </Link>
                </li>
                <li>
                  <Link href="/carroceria/minivan" className="text-gray-400 hover:text-white transition-colors">
                    Minivan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Contacto
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <MapPin className="size-4 mt-0.5 flex-shrink-0 text-gray-500" />
                  <span className="text-gray-400">
                    Aarón Sáenz Garza 1902, Plaza Oasis, Local 1109, Monterrey, NL
                  </span>
                </li>
                <li>
                  <a
                    href="tel:+528187049079"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Phone className="size-4 text-gray-500" />
                    (+52) 81 8704 9079
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hola@trefa.mx"
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Mail className="size-4 text-gray-500" />
                    hola@trefa.mx
                  </a>
                </li>
                <li className="pt-2">
                  <Link href="/contacto" className="text-gray-400 hover:text-white transition-colors">
                    Todas las sucursales →
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                    Preguntas Frecuentes
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gray-800" />

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} Grupo TREFA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/terminos" className="text-gray-500 hover:text-white transition-colors">
              Términos y Condiciones
            </Link>
            <Link href="/politica-de-privacidad" className="text-gray-500 hover:text-white transition-colors">
              Privacidad
            </Link>
            <a
              href="https://blog.trefa.mx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-white transition-colors"
            >
              Blog
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
