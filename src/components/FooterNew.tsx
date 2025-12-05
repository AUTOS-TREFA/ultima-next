'use client';

import { ArrowRightIcon, FacebookIcon as Facebook, InstagramIcon as Instagram, LinkedinIcon as Linkedin, MapPinIcon as MapPin, PhoneIcon as Phone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import TrefaLogo from '@/components/TrefaLogo'

const Footer = () => {
  const { session } = useAuth()
  const router = useRouter()

  // Get app version from git commit hash
  const appVersion = process.env.NEXT_PUBLIC_GIT_COMMIT || process.env.NEXT_PUBLIC_APP_VERSION || 'dev'

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string, authRequired: boolean) => {
    if (authRequired && !session) {
      e.preventDefault()
      localStorage.setItem('loginRedirect', to)
      router.push('/acceder')
    }
  }

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/autostrefamx',
      icon: Facebook,
      color: 'hover:text-blue-500'
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/autostrefamx',
      icon: Instagram,
      color: 'hover:text-pink-500'
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/autostrefamx',
      icon: Linkedin,
      color: 'hover:text-blue-600'
    },
  ]

  return (
    <footer className="bg-gray-900 text-gray-300 pb-20 lg:pb-0">
      <div className='mx-auto grid max-w-7xl grid-cols-6 gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-16 md:py-24'>
        <div className='col-span-full flex flex-col items-start gap-4 lg:col-span-2'>
          <TrefaLogo />
          <p className='text-gray-400'>
            Tu auto seminuevo con financiamiento a tu medida. Proceso 100% digital, seguro y transparente.
            Más de 5,000 autos vendidos en el noreste de México.
          </p>
          <Separator className='!w-35 bg-gray-700' />
          <div className='flex items-center gap-4'>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target='_blank'
                rel="noopener noreferrer"
                className={`text-gray-400 transition-colors ${social.color}`}
                aria-label={social.name}
              >
                <social.icon className='size-5' />
              </a>
            ))}
          </div>

          {/* Address and Contact */}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400">
                Aarón Sáenz Garza 1902, Plaza Oasis, Local 1109, Monterrey, NL
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-primary-500 flex-shrink-0" />
              <a
                href="tel:+528187049079"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                (+52) 818-704-9079
              </a>
            </div>
          </div>
        </div>

        <div className='col-span-full grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-4 lg:gap-8'>
          {/* Explorar */}
          <div className='flex flex-col gap-5'>
            <div className='text-lg font-medium text-gray-200'>Explorar</div>
            <ul className='text-gray-400 space-y-3'>
              <li>
                <Link href='/' className="hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <Link href='/autos' className="hover:text-white transition-colors">Inventario</Link>
              </li>
              <li>
                <Link href='/vender-mi-auto' className="hover:text-white transition-colors">Vender mi Auto</Link>
              </li>
              <li>
                <Link href='/financiamientos' className="hover:text-white transition-colors">Financiamientos</Link>
              </li>
              <li>
                <Link href='/promociones' className="hover:text-white transition-colors">Promociones</Link>
              </li>
              <li>
                <Link href='/kit-trefa' className="hover:text-white transition-colors">Kit de Confianza</Link>
              </li>
              <li>
                <Link href='/conocenos' className="hover:text-white transition-colors">Conócenos</Link>
              </li>
            </ul>
          </div>

          {/* Mi Cuenta */}
          <div className='flex flex-col gap-5'>
            <div className='text-lg font-medium text-gray-200'>Mi Cuenta</div>
            <ul className='text-gray-400 space-y-3'>
              <li>
                <Link href='/acceder' className="hover:text-white transition-colors">Iniciar Sesión</Link>
              </li>
              <li>
                <Link
                  href='/escritorio'
                  className="hover:text-white transition-colors"
                  onClick={(e) => handleLinkClick(e, '/escritorio', true)}
                >
                  Mi Escritorio
                </Link>
              </li>
              <li>
                <Link
                  href='/escritorio/favoritos'
                  className="hover:text-white transition-colors"
                  onClick={(e) => handleLinkClick(e, '/escritorio/favoritos', true)}
                >
                  Mis Favoritos
                </Link>
              </li>
              <li>
                <Link
                  href='/escritorio/aplicacion'
                  className="hover:text-white transition-colors"
                  onClick={(e) => handleLinkClick(e, '/escritorio/aplicacion', true)}
                >
                  Solicitar Financiamiento
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div className='flex flex-col gap-5'>
            <div className='text-lg font-medium text-gray-200'>Soporte</div>
            <ul className='text-gray-400 space-y-3'>
              <li>
                <Link href='/faq' className="hover:text-white transition-colors">Preguntas Frecuentes</Link>
              </li>
              <li>
                <Link href='/contacto' className="hover:text-white transition-colors">Contacto</Link>
              </li>
              <li>
                <Link href='/vacantes' className="hover:text-white transition-colors">Vacantes</Link>
              </li>
              <li>
                <a
                  href="https://blog.trefa.mx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <Link href='/politica-de-privacidad' className="hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className='col-span-full flex flex-col gap-5 sm:col-span-1'>
            <div>
              <p className='mb-3 text-lg font-medium text-gray-200'>Newsletter</p>
              <p className='mb-3 text-sm text-gray-400'>
                Recibe las mejores ofertas y novedades
              </p>
              <div className='flex flex-col gap-2'>
                <Input
                  type='email'
                  placeholder='Tu correo electrónico'
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary-500"
                />
                <Button
                  type='submit'
                  className='bg-primary-600 hover:bg-primary-700 text-white w-full'
                >
                  Suscribirse
                  <ArrowRightIcon className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gray-800" />

      <div className='mx-auto flex max-w-7xl flex-col sm:flex-row justify-between items-center gap-4 px-4 py-6 sm:px-6'>
        <p className='text-center sm:text-left font-medium text-gray-400'>
          {`© ${new Date().getFullYear()}`} <Link href="/" className="hover:text-white transition-colors">Grupo TREFA</Link>.
          Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Versión: {appVersion}</span>
          <Link
            href="/beta-v.0.1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Danos tu opinión
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
