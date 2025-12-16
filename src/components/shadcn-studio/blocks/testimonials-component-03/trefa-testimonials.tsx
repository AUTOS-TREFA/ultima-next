'use client'

import TestimonialsComponent, { HeroSlideItem, TestimonialItem } from './testimonials-component-03'

// TREFA hero slides with featured quotes
const heroSlides: HeroSlideItem[] = [
  {
    description: 'El proceso fue increíblemente rápido y transparente. En menos de 48 horas ya tenía mi nuevo auto. ¡El mejor servicio!',
    logo: '/images/trefalogo.png',
    alt: 'TREFA Logo'
  },
  {
    description: 'La mejor experiencia de compra que he tenido. Sin presión, sin trucos, solo un servicio honesto y eficiente.',
    logo: '/images/trefalogo.png',
    alt: 'TREFA Logo'
  },
  {
    description: 'La calidad de los autos es de primera. Compré una camioneta y parece nueva. La inspección de 150 puntos realmente da confianza.',
    logo: '/images/trefalogo.png',
    alt: 'TREFA Logo'
  }
]

// TREFA testimonials - using local SVG avatars and logos
const testimonials: TestimonialItem[] = [
  {
    name: 'Mariana G.',
    handle: '@mariana.g',
    avatar: '/images/avatars/avatar-1.svg',
    rating: 5,
    title: 'Servicio increíble',
    content: 'El proceso fue increíblemente rápido y transparente. En menos de 48 horas ya tenía mi nuevo auto. ¡El mejor servicio!',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Carlos R.',
    handle: '@carlos.r',
    avatar: '/images/avatars/avatar-2.svg',
    rating: 5,
    title: 'Venta sin complicaciones',
    content: 'Vendí mi auto a un precio justo y sin salir de casa. El equipo de TREFA se encargó de todo. Totalmente recomendado.',
    platformName: 'Facebook',
    platformImage: '/images/facebook-logo.svg'
  },
  {
    name: 'Sofía L.',
    handle: '@sofia.l',
    avatar: '/images/avatars/avatar-3.svg',
    rating: 5,
    title: 'Excelente asesoría',
    content: 'Tenía dudas sobre el financiamiento, pero el asesor me guió paso a paso y encontró la mejor opción para mí. Súper pacientes y profesionales.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Javier Torres',
    handle: '@javier.t',
    avatar: '/images/avatars/avatar-4.svg',
    rating: 5,
    title: 'Autos de calidad',
    content: 'La calidad de los autos es de primera. Compré una camioneta y parece nueva. La inspección de 150 puntos realmente da confianza.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Laura Fernández',
    handle: '@laura.f',
    avatar: '/images/avatars/avatar-5.svg',
    rating: 5,
    title: 'Proceso digital cómodo',
    content: 'Buen servicio en general. El proceso digital es muy cómodo, aunque la entrega tardó un día más de lo esperado. Aún así, los recomiendo.',
    platformName: 'Facebook',
    platformImage: '/images/facebook-logo.svg'
  },
  {
    name: 'Ricardo Mendoza',
    handle: '@ricardo.m',
    avatar: '/images/avatars/avatar-6.svg',
    rating: 5,
    title: 'Servicio honesto',
    content: 'La mejor experiencia de compra que he tenido. Sin presión, sin trucos, solo un servicio honesto y eficiente. El portal de clientes es muy útil.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Ana Patricia',
    handle: '@ana.p',
    avatar: '/images/avatars/avatar-7.svg',
    rating: 5,
    title: 'Financiamiento excelente',
    content: '¡Me encanta mi nuevo coche! Gracias a todo el equipo de TREFA por hacerlo tan fácil. El financiamiento que me consiguieron fue excelente.',
    platformName: 'Facebook',
    platformImage: '/images/facebook-logo.svg'
  },
  {
    name: 'David Ortiz',
    handle: '@david.o',
    avatar: '/images/avatars/avatar-8.svg',
    rating: 5,
    title: 'Proceso impecable',
    content: 'Desde la valuación de mi auto antiguo hasta la compra del nuevo, todo el proceso fue impecable. Muy profesionales.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Valeria Sosa',
    handle: '@valeria.s',
    avatar: '/images/avatars/avatar-9.svg',
    rating: 5,
    title: '10/10 experiencia',
    content: '10/10. El personal es amable y el proceso 100% digital me ahorró muchísimo tiempo. Definitivamente volvería a comprar aquí.',
    platformName: 'Facebook',
    platformImage: '/images/facebook-logo.svg'
  },
  {
    name: 'Fernando Díaz',
    handle: '@fernando.d',
    avatar: '/images/avatars/avatar-10.svg',
    rating: 5,
    title: 'Auto en excelentes condiciones',
    content: 'El auto está en excelentes condiciones. El único detalle fue que el papeleo final tomó un poco más de tiempo. Fuera de eso, todo perfecto.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Gabriela Ríos',
    handle: '@gabriela.r',
    avatar: '/images/avatars/avatar-11.svg',
    rating: 5,
    title: 'Atención rápida por WhatsApp',
    content: 'La atención por WhatsApp es súper rápida y eficiente. Resolvieron todas mis dudas al momento. ¡Gran servicio!',
    platformName: 'Facebook',
    platformImage: '/images/facebook-logo.svg'
  },
  {
    name: 'Alejandro V.',
    handle: '@alejandro.v',
    avatar: '/images/avatars/avatar-12.svg',
    rating: 5,
    title: 'Cero presiones',
    content: 'El mejor trato que he recibido. Me explicaron todo sobre el financiamiento y me ayudaron a elegir la mejor opción. Cero presiones y muy transparentes.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Patricia M.',
    handle: '@patricia.m',
    avatar: '/images/avatars/avatar-1.svg',
    rating: 5,
    title: 'Tranquilidad total',
    content: 'Muchísima apoya en el trámite y paciencia al momento de elegir el mejor financiamiento.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Daniel Herrera',
    handle: '@daniel.h',
    avatar: '/images/avatars/avatar-2.svg',
    rating: 5,
    title: 'Nos ofrecía tranquilidad y seguridad',
    content: 'Su experiencia de compra en TREFA es la encomiable en ninguna parte',
    platformName: 'Facebook',
    platformImage: '/images/facebook-logo.svg'
  },
  {
    name: 'Carmen Sánchez',
    handle: '@carmen.s',
    avatar: '/images/avatars/avatar-3.svg',
    rating: 5,
    title: 'Me ayudó a encontrar el carro perfecto para mí',
    content: 'Me ayudó a encontrar el carro perfecto para mí, ofreciéndome totalmente nuevas opciones tanto o más de lo que buscaba que hacerte fue como facil.',
    platformName: 'Google',
    platformImage: '/images/google-logo.svg'
  },
  {
    name: 'Roberto García',
    handle: '@roberto.g',
    avatar: '/images/avatars/avatar-4.svg',
    rating: 5,
    title: 'El vendedor fue honesto',
    content: 'El vendedor fue honesto en todo, me aconsejó y eso de que fueron las cosas bien.',
    platformName: 'Facebook',
    platformImage: '/images/facebook-logo.svg'
  }
]

const TrefaTestimonials = () => {
  return <TestimonialsComponent heroSlides={heroSlides} testimonials={testimonials} />
}

export default TrefaTestimonials
