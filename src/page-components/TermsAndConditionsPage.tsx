'use client';

import React from 'react';
import useSEO from '../hooks/useSEO';

const TermsAndConditionsPage: React.FC = () => {
  useSEO({
    title: 'Términos y Condiciones | TREFA',
    description: 'Consulta nuestros términos y condiciones de uso para conocer las reglas y políticas de TREFA.',
    keywords: 'términos y condiciones, términos de uso, trefa, condiciones de servicio'
  });

  return (
    <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <article className="prose prose-lg lg:prose-xl max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-primary-600 hover:prose-a:text-primary-700">
          <h1 className="text-center">Términos y Condiciones de TREFA</h1>
          <p className="lead text-center text-gray-500">Última actualización: 3 de Diciembre, 2025</p>

          <p>Bienvenido a TREFA. Al acceder y utilizar nuestro sitio web, aplicaciones móviles, servicios y productos, aceptas cumplir con los siguientes términos y condiciones. Te invitamos a leerlos detenidamente antes de utilizar cualquiera de nuestros servicios.</p>

          <h2>1. Aceptación de los Términos</h2>
          <p>Al acceder o usar los servicios de TREFA, confirmas que:</p>
          <ul>
            <li>Eres mayor de 18 años o cuentas con el consentimiento de un tutor legal.</li>
            <li>Tienes la capacidad legal para celebrar contratos vinculantes.</li>
            <li>Aceptas cumplir con todos los términos aquí establecidos.</li>
            <li>Proporcionarás información verdadera, precisa y actualizada.</li>
          </ul>
          <p>Si no estás de acuerdo con estos términos, te pedimos que no utilices nuestros servicios.</p>

          <h2>2. Servicios Ofrecidos</h2>
          <p>TREFA es una agencia especializada en la venta de autos seminuevos con múltiples sucursales en Nuevo León, México. Nuestros servicios incluyen:</p>
          <ul>
            <li><strong>Venta de autos seminuevos</strong> con garantía y financiamiento disponible.</li>
            <li><strong>Plataforma digital</strong> para buscar, comparar y solicitar información sobre autos.</li>
            <li><strong>Asesoría de financiamiento</strong> a través de instituciones bancarias y financieras autorizadas.</li>
            <li><strong>Servicio de apartado</strong> para reservar autos de interés.</li>
            <li><strong>Inspección y certificación</strong> de autos disponibles en inventario.</li>
          </ul>

          <h2>3. Registro y Cuenta de Usuario</h2>
          <p>Para acceder a ciertas funciones de nuestro sitio web, es posible que necesites crear una cuenta. Al registrarte, te comprometes a:</p>
          <ul>
            <li>Proporcionar información completa y verídica.</li>
            <li>Mantener la confidencialidad de tu contraseña y credenciales de acceso.</li>
            <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta.</li>
            <li>Aceptar que eres responsable de todas las actividades realizadas bajo tu cuenta.</li>
          </ul>
          <p>Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos o realicen actividades fraudulentas.</p>

          <h2>4. Uso Aceptable</h2>
          <p>Al utilizar nuestros servicios, te comprometes a NO:</p>
          <ul>
            <li>Publicar contenido ofensivo, difamatorio, ilegal o que infrinja derechos de terceros.</li>
            <li>Intentar acceder de manera no autorizada a sistemas, cuentas o información de TREFA o de otros usuarios.</li>
            <li>Usar nuestros servicios para actividades ilegales, fraudulentas o dañinas.</li>
            <li>Interferir con el funcionamiento normal de nuestro sitio web o servidores.</li>
            <li>Extraer, copiar o distribuir contenido de nuestro sitio sin autorización previa.</li>
          </ul>

          <h2>5. Compra y Apartado de Autos</h2>

          <h3>5.1 Proceso de Compra</h3>
          <p>La compra de un auto a través de TREFA está sujeta a:</p>
          <ul>
            <li>Disponibilidad del auto al momento de la transacción.</li>
            <li>Verificación y aprobación de documentación requerida.</li>
            <li>Cumplimiento de los requisitos de financiamiento (si aplica).</li>
            <li>Firma de contrato de compraventa ante las autoridades correspondientes.</li>
          </ul>

          <h3>5.2 Apartado de Autos</h3>
          <p>El servicio de apartado permite reservar un auto mediante un pago anticipado. Condiciones:</p>
          <ul>
            <li>El monto del apartado se aplicará como anticipo al precio total del auto.</li>
            <li>El apartado tiene una vigencia máxima de 7 días naturales, salvo acuerdo distinto.</li>
            <li>Si la solicitud de financiamiento es rechazada por la institución financiera, el apartado será reembolsado en su totalidad.</li>
            <li>Si el cliente decide no continuar con la compra por razones distintas al rechazo de financiamiento, el apartado no será reembolsable, salvo casos excepcionales evaluados por TREFA.</li>
            <li>TREFA se reserva el derecho de cancelar el apartado y devolver el monto si el auto resulta no disponible por causas ajenas a nuestra voluntad.</li>
          </ul>

          <h2>6. Financiamiento y Crédito</h2>
          <p>TREFA trabaja con diversas instituciones financieras para ofrecer opciones de financiamiento. Es importante que comprendas:</p>
          <ul>
            <li>El otorgamiento del crédito está sujeto a aprobación por parte de la institución financiera correspondiente.</li>
            <li>TREFA actúa únicamente como intermediario y no garantiza la aprobación del financiamiento.</li>
            <li>Las tasas de interés, plazos y condiciones del crédito son determinadas por la institución financiera.</li>
            <li>Es tu responsabilidad leer y comprender los términos del contrato de crédito antes de firmarlo.</li>
            <li>TREFA no es responsable de los términos, comisiones o condiciones establecidas por terceros financieros.</li>
          </ul>

          <h2>7. Precios y Disponibilidad</h2>
          <ul>
            <li>Todos los precios mostrados en nuestro sitio web están en pesos mexicanos (MXN) e incluyen IVA, salvo que se indique lo contrario.</li>
            <li>Los precios, promociones y disponibilidad de autos están sujetos a cambios sin previo aviso.</li>
            <li>Nos esforzamos por mantener información actualizada, pero errores tipográficos o de sistema pueden ocurrir. En tales casos, TREFA se reserva el derecho de corregir el error y notificar al cliente.</li>
            <li>Las fotografías e imágenes son referenciales y pueden diferir ligeramente del producto real.</li>
          </ul>

          <h2>8. Garantías y Condición de los Autos</h2>
          <p>Todos los autos comercializados por TREFA pasan por inspecciones exhaustivas. Sin embargo:</p>
          <ul>
            <li>Los autos seminuevos se venden en el estado en que se encuentran al momento de la entrega.</li>
            <li>Se ofrece garantía limitada según lo especificado en el contrato de compraventa.</li>
            <li>La garantía no cubre daños por uso indebido, negligencia o accidentes posteriores a la entrega.</li>
            <li>Es responsabilidad del comprador revisar el auto antes de finalizar la compra.</li>
          </ul>

          <h2>9. Devoluciones y Cancelaciones</h2>
          <ul>
            <li>Las ventas de autos son finales y no se aceptan devoluciones una vez firmado el contrato de compraventa y entregado el auto.</li>
            <li>Casos excepcionales serán evaluados individualmente por TREFA.</li>
            <li>El comprador tiene derecho a cancelar antes de la entrega del auto, sujeto a los términos del apartado y contrato.</li>
          </ul>

          <h2>10. Propiedad Intelectual</h2>
          <p>Todo el contenido de nuestro sitio web, incluyendo textos, imágenes, logotipos, gráficos, videos y software, es propiedad de TREFA o de sus licenciantes y está protegido por las leyes de propiedad intelectual de México y tratados internacionales.</p>
          <p>Queda estrictamente prohibido:</p>
          <ul>
            <li>Copiar, modificar, distribuir o reproducir cualquier contenido sin autorización escrita.</li>
            <li>Usar nuestras marcas, logotipos o nombres comerciales sin consentimiento previo.</li>
            <li>Crear obras derivadas basadas en nuestro contenido.</li>
          </ul>

          <h2>11. Privacidad y Protección de Datos</h2>
          <p>Tu privacidad es importante para nosotros. Al utilizar nuestros servicios, aceptas nuestra{' '}
            <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer">
              Política de Privacidad
            </a>, que describe cómo recopilamos, usamos y protegemos tu información personal.</p>

          <h2>12. Limitación de Responsabilidad</h2>
          <p>TREFA no será responsable por:</p>
          <ul>
            <li>Daños indirectos, incidentales, especiales o consecuentes derivados del uso de nuestros servicios.</li>
            <li>Pérdidas o daños causados por virus informáticos, ataques cibernéticos o fallos técnicos.</li>
            <li>Interrupciones en el servicio por mantenimiento, actualizaciones o causas de fuerza mayor.</li>
            <li>Información o contenido proporcionado por terceros, incluyendo instituciones financieras.</li>
            <li>Decisiones tomadas por el usuario basándose en la información del sitio web.</li>
          </ul>
          <p>Nuestra responsabilidad máxima no excederá el monto pagado por el usuario en la transacción que dio origen al reclamo.</p>

          <h2>13. Enlaces a Terceros</h2>
          <p>Nuestro sitio web puede contener enlaces a sitios de terceros (bancos, financieras, redes sociales). TREFA no controla ni es responsable del contenido, políticas de privacidad o prácticas de estos sitios externos. Te recomendamos revisar los términos y políticas de cualquier sitio que visites.</p>

          <h2>14. Modificaciones a los Términos</h2>
          <p>TREFA se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio web. Es tu responsabilidad revisar periódicamente estos términos. El uso continuado de nuestros servicios después de la publicación de cambios constituye tu aceptación de dichos cambios.</p>

          <h2>15. Ley Aplicable y Jurisdicción</h2>
          <p>Estos términos y condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia derivada de estos términos será resuelta en los tribunales competentes de Monterrey, Nuevo León, México, renunciando las partes a cualquier otra jurisdicción que pudiera corresponderles.</p>

          <h2>16. Contacto</h2>
          <p>Si tienes preguntas, dudas o comentarios sobre estos términos y condiciones, puedes contactarnos a través de:</p>
          <ul>
            <li><strong>Correo electrónico</strong>: <a href="mailto:contacto@trefa.mx">contacto@trefa.mx</a></li>
            <li><strong>Teléfono</strong>: <a href="tel:+528183336577">(81) 8333-6577</a></li>
            <li><strong>Dirección</strong>: Av. Revolución 1850, Col. Moderna, Monterrey, Nuevo León</li>
          </ul>

          <h2>17. Disposiciones Generales</h2>
          <ul>
            <li>Si alguna disposición de estos términos es considerada inválida o inaplicable, las demás disposiciones seguirán vigentes.</li>
            <li>La falta de ejercicio de cualquier derecho bajo estos términos no constituye una renuncia a dicho derecho.</li>
            <li>Estos términos constituyen el acuerdo completo entre tú y TREFA respecto al uso de nuestros servicios.</li>
            <li>TREFA puede ceder estos términos sin tu consentimiento previo. Tú no puedes ceder tus derechos u obligaciones sin nuestro consentimiento escrito.</li>
          </ul>

          <div className="mt-12 p-6 bg-gray-50 border-l-4 border-primary-600 rounded-lg">
            <p className="text-sm text-gray-600 mb-0">
              <strong>Nota importante:</strong> Al utilizar los servicios de TREFA, confirmas que has leído, comprendido y aceptado estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, por favor abstente de usar nuestros servicios.
            </p>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            © 2025 TREFA. Todos los derechos reservados.
          </p>
        </article>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
