'use client';

import React from 'react';
import Link from 'next/link';
// SEO is handled by metadata in Next.js app router
import {
  PhoneIcon as Phone,
  MailIcon as Mail,
  MapPinIcon as MapPin,
  ClockIcon as Clock,
  MessageCircleIcon as MessageCircle
} from '../components/icons';
import LazyImage from '../components/LazyImage';

const ContactPage: React.FC = () => {
  // SEO metadata is handled in the page.tsx file in Next.js

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Respuesta inmediata',
      detail: '+52 81 8704 9079',
      link: 'https://wa.me/5218187049079',
      linkText: 'Iniciar Chat',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Phone,
      title: 'Teléfono',
      description: 'Llámanos directamente',
      detail: '(81) 8704-9079',
      link: 'tel:+528187049079',
      linkText: 'Llamar Ahora',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Mail,
      title: 'Correo Electrónico',
      description: 'Escríbenos',
      detail: 'contacto@trefa.mx',
      link: 'mailto:contacto@trefa.mx',
      linkText: 'Enviar Email',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const scheduleInfo = [
    { day: 'Lunes a Viernes', hours: '9:00 AM - 8:00 PM' },
    { day: 'Sábados', hours: '9:00 AM - 7:00 PM' },
    { day: 'Domingos', hours: '10:00 AM - 5:00 PM' }
  ];

  const faqs = [
    {
      question: '¿Dónde están ubicados?',
      answer: 'Nos encontramos en el área metropolitana de Monterrey, Nuevo León. Contáctanos por WhatsApp para recibir la dirección exacta de nuestro showroom y coordinar tu visita.'
    },
    {
      question: '¿Necesito hacer cita para visitar el showroom?',
      answer: 'No es necesario hacer cita, pero te recomendamos avisarnos por WhatsApp para asegurar que el auto de tu interés esté disponible y que un asesor te pueda atender personalmente.'
    },
    {
      question: '¿Puedo probar los autos antes de comprar?',
      answer: 'Sí, ofrecemos pruebas de manejo para todos nuestros autos. Solo necesitas presentar tu licencia de conducir vigente y agendar tu prueba con anticipación.'
    },
    {
      question: '¿Cómo funciona el proceso de financiamiento?',
      answer: 'Nuestro proceso de financiamiento es 100% digital. Completa tu solicitud en línea y recibe una respuesta del banco en menos de 24 horas. Tu asesor personal te guiará en cada paso.'
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 to-amber-700 text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
              Contáctanos
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 leading-relaxed">
              Estamos aquí para ayudarte a encontrar el auto perfecto o vender el tuyo al mejor precio
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Múltiples Formas de Contacto
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Elige el método que más te convenga y recibe atención personalizada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100"
              >
                <div className={`flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${method.color} mb-6 mx-auto`}>
                  <method.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  {method.title}
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {method.description}
                </p>
                <p className="text-lg font-semibold text-gray-900 text-center mb-6">
                  {method.detail}
                </p>
                <a
                  href={method.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-3 px-6 rounded-lg bg-gradient-to-r ${method.color} text-white font-semibold hover:opacity-90 transition-opacity`}
                >
                  {method.linkText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Schedule */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Location */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-700 mr-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Ubicación
                </h3>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Área Metropolitana de Monterrey, Nuevo León
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Para recibir la dirección exacta de nuestro showroom y coordinar tu visita, contáctanos por WhatsApp. Te compartiremos la ubicación y te ayudaremos con cualquier duda sobre cómo llegar.
              </p>
              <a
                href="https://wa.me/5218187049079?text=Hola%2C%20me%20gustar%C3%ADa%20saber%20la%20direcci%C3%B3n%20del%20showroom"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-3 px-6 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Solicitar Dirección
              </a>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-700 mr-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Horario de Atención
                </h3>
              </div>
              <div className="space-y-4">
                {scheduleInfo.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0"
                  >
                    <span className="text-gray-900 font-semibold">
                      {schedule.day}
                    </span>
                    <span className="text-gray-600">
                      {schedule.hours}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Nota:</strong> Atendemos por WhatsApp 24/7 para tu comodidad. Responderemos lo antes posible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Image */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1">
              <LazyImage
                src="/images/landing-asset-main.png"
                alt="Equipo de atención al cliente TREFA"
                className="w-full h-full"
                objectFit="contain"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
                Atención Personalizada
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                En TREFA, cada cliente es único. Nuestro equipo de asesores expertos está capacitado para entender tus necesidades específicas y ofrecerte las mejores opciones.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Ya sea que estés buscando tu primer auto, necesites un auto familiar, o quieras vender tu auto actual, estamos aquí para guiarte en cada paso del proceso.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Nuestro compromiso es brindarte una experiencia excepcional desde el primer contacto hasta que te vayas manejando tu nuevo auto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-lg text-gray-600">
              Respuestas rápidas a las dudas más comunes
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg text-gray-700 mb-6">
              ¿Tienes más preguntas?
            </p>
            <Link
              href="/faq"
              className="inline-block py-3 px-8 rounded-lg bg-gradient-to-r from-orange-500 to-amber-700 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Ver Todas las FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500 to-amber-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Descubre cómo podemos ayudarte a conseguir el auto de tus sueños
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/autos"
              className="inline-block text-lg font-semibold transition-all duration-300 px-8 py-4 rounded-lg bg-white text-orange-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Ver Inventario
            </Link>
            <a
              href="https://wa.me/5218187049079"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-lg font-semibold transition-all duration-300 px-8 py-4 rounded-lg border-2 border-white text-white hover:bg-white hover:text-orange-600"
            >
              Hablar por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
