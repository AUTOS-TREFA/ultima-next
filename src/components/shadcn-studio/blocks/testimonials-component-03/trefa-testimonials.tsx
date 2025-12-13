'use client'

import TestimonialsComponent, { HeroSlideItem, TestimonialItem } from './testimonials-component-03'

// TREFA hero slides with featured quotes
const heroSlides: HeroSlideItem[] = [
  {
    description: 'El proceso fue increíblemente rápido y transparente. En menos de 48 horas ya tenía mi nuevo auto. ¡El mejor servicio!',
    logo: 'https://trefa.mx/images/logoblanco.png',
    alt: 'TREFA Logo'
  },
  {
    description: 'La mejor experiencia de compra que he tenido. Sin presión, sin trucos, solo un servicio honesto y eficiente.',
    logo: 'https://trefa.mx/images/logoblanco.png',
    alt: 'TREFA Logo'
  },
  {
    description: 'La calidad de los autos es de primera. Compré una camioneta y parece nueva. La inspección de 150 puntos realmente da confianza.',
    logo: 'https://trefa.mx/images/logoblanco.png',
    alt: 'TREFA Logo'
  }
]

// TREFA testimonials
const testimonials: TestimonialItem[] = [
  {
    name: 'Mariana G.',
    handle: '@mariana.g',
    avatar: 'https://randomuser.me/api/portraits/women/18.jpg',
    rating: 5,
    title: 'Servicio increíble',
    content: 'El proceso fue increíblemente rápido y transparente. En menos de 48 horas ya tenía mi nuevo auto. ¡El mejor servicio!',
    platformName: 'Google',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  },
  {
    name: 'Carlos R.',
    handle: '@carlos.r',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 5,
    title: 'Venta sin complicaciones',
    content: 'Vendí mi auto a un precio justo y sin salir de casa. El equipo de TREFA se encargó de todo. Totalmente recomendado.',
    platformName: 'Facebook',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png'
  },
  {
    name: 'Sofía L.',
    handle: '@sofia.l',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    rating: 5,
    title: 'Excelente asesoría',
    content: 'Tenía dudas sobre el financiamiento, pero el asesor me guió paso a paso y encontró la mejor opción para mí. Súper pacientes y profesionales.',
    platformName: 'Google',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  },
  {
    name: 'Javier Torres',
    handle: '@javier.t',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    rating: 5,
    title: 'Autos de calidad',
    content: 'La calidad de los autos es de primera. Compré una camioneta y parece nueva. La inspección de 150 puntos realmente da confianza.',
    platformName: 'Google',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  },
  {
    name: 'Laura Fernández',
    handle: '@laura.f',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5,
    title: 'Proceso digital cómodo',
    content: 'Buen servicio en general. El proceso digital es muy cómodo, aunque la entrega tardó un día más de lo esperado. Aún así, los recomiendo.',
    platformName: 'Facebook',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png'
  },
  {
    name: 'Ricardo Mendoza',
    handle: '@ricardo.m',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    rating: 5,
    title: 'Servicio honesto',
    content: 'La mejor experiencia de compra que he tenido. Sin presión, sin trucos, solo un servicio honesto y eficiente. El portal de clientes es muy útil.',
    platformName: 'Google',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  },
  {
    name: 'Ana Patricia',
    handle: '@ana.p',
    avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
    rating: 5,
    title: 'Financiamiento excelente',
    content: '¡Me encanta mi nuevo coche! Gracias a todo el equipo de TREFA por hacerlo tan fácil. El financiamiento que me consiguieron fue excelente.',
    platformName: 'Facebook',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png'
  },
  {
    name: 'David Ortiz',
    handle: '@david.o',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    rating: 5,
    title: 'Proceso impecable',
    content: 'Desde la valuación de mi auto antiguo hasta la compra del nuevo, todo el proceso fue impecable. Muy profesionales.',
    platformName: 'Google',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  },
  {
    name: 'Valeria Sosa',
    handle: '@valeria.s',
    avatar: 'https://randomuser.me/api/portraits/women/88.jpg',
    rating: 5,
    title: '10/10 experiencia',
    content: '10/10. El personal es amable y el proceso 100% digital me ahorró muchísimo tiempo. Definitivamente volvería a comprar aquí.',
    platformName: 'Facebook',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png'
  },
  {
    name: 'Fernando Díaz',
    handle: '@fernando.d',
    avatar: 'https://randomuser.me/api/portraits/men/56.jpg',
    rating: 5,
    title: 'Auto en excelentes condiciones',
    content: 'El auto está en excelentes condiciones. El único detalle fue que el papeleo final tomó un poco más de tiempo. Fuera de eso, todo perfecto.',
    platformName: 'Google',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  },
  {
    name: 'Gabriela Ríos',
    handle: '@gabriela.r',
    avatar: 'https://randomuser.me/api/portraits/women/52.jpg',
    rating: 5,
    title: 'Atención rápida por WhatsApp',
    content: 'La atención por WhatsApp es súper rápida y eficiente. Resolvieron todas mis dudas al momento. ¡Gran servicio!',
    platformName: 'Facebook',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png'
  },
  {
    name: 'Alejandro V.',
    handle: '@alejandro.v',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    rating: 5,
    title: 'Cero presiones',
    content: 'El mejor trato que he recibido. Me explicaron todo sobre el financiamiento y me ayudaron a elegir la mejor opción. Cero presiones y muy transparentes.',
    platformName: 'Google',
    platformImage: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  }
]

const TrefaTestimonials = () => {
  return <TestimonialsComponent heroSlides={heroSlides} testimonials={testimonials} />
}

export default TrefaTestimonials
