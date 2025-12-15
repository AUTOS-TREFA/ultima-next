import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText, UserCheck, Mail, Phone, MapPin } from 'lucide-react';

const ProteccionDatosPage: React.FC = () => {
    return (
        <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
                        <Shield className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Protección de Datos Personales</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        En TREFA, tu privacidad es nuestra prioridad. Conoce cómo protegemos y gestionamos tu información personal.
                    </p>
                    <p className="text-sm text-gray-500 mt-4">Última actualización: 15 de Diciembre, 2024</p>
                </div>

                {/* Main Content */}
                <article className="prose prose-lg max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-primary-600 hover:prose-a:text-primary-700">

                    {/* Section: Responsable */}
                    <section className="mb-12 p-6 bg-gray-50 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                                <UserCheck className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mt-0 mb-3">Responsable del Tratamiento de Datos</h2>
                                <p className="mb-4">TREFA (Grupo TREFA S.A. de C.V.) es la entidad responsable del tratamiento de tus datos personales, con domicilio en:</p>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <span className="font-medium">Av. Eugenio Garza Sada #2411, Col. Roma, Monterrey, N.L., México, C.P. 64700</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <a href="mailto:privacidad@trefa.mx" className="text-primary-600 hover:underline">privacidad@trefa.mx</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <a href="tel:+528183582400" className="text-primary-600 hover:underline">(81) 8358 2400</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Marco Legal */}
                    <section className="mb-12">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mt-0 mb-3">Marco Legal Aplicable</h2>
                                <p>El tratamiento de tus datos personales se realiza en cumplimiento de:</p>
                                <ul>
                                    <li><strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> - México</li>
                                    <li><strong>Reglamento de la LFPDPPP</strong></li>
                                    <li><strong>Lineamientos del Aviso de Privacidad</strong> emitidos por el INAI</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section: Datos Recopilados */}
                    <section className="mb-12">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Eye className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mt-0 mb-3">Datos Personales que Recopilamos</h2>
                                <p>Dependiendo de la interacción que tengas con TREFA, podemos recopilar:</p>

                                <h3 className="text-lg font-semibold mt-4 mb-2">Datos de Identificación</h3>
                                <ul>
                                    <li>Nombre completo</li>
                                    <li>Correo electrónico</li>
                                    <li>Número de teléfono</li>
                                    <li>Domicilio (solo para solicitudes de financiamiento)</li>
                                </ul>

                                <h3 className="text-lg font-semibold mt-4 mb-2">Datos Financieros (solo para solicitudes de crédito)</h3>
                                <ul>
                                    <li>Comprobante de ingresos</li>
                                    <li>Historial crediticio (consultado con tu autorización)</li>
                                    <li>Referencias personales</li>
                                </ul>

                                <h3 className="text-lg font-semibold mt-4 mb-2">Datos de Navegación</h3>
                                <ul>
                                    <li>Dirección IP</li>
                                    <li>Tipo de navegador y dispositivo</li>
                                    <li>Páginas visitadas y tiempo de permanencia</li>
                                    <li>Cookies y tecnologías similares</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section: Finalidades */}
                    <section className="mb-12 p-6 bg-primary-50 rounded-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mt-0 mb-3">Finalidades del Tratamiento</h2>

                        <h3 className="text-lg font-semibold mt-4 mb-2">Finalidades Primarias (necesarias)</h3>
                        <ul>
                            <li>Gestionar y dar seguimiento a tu solicitud de compra de vehículo</li>
                            <li>Procesar tu solicitud de financiamiento automotriz</li>
                            <li>Verificar tu identidad y capacidad crediticia</li>
                            <li>Cumplir con obligaciones legales y regulatorias</li>
                            <li>Atender consultas y brindar soporte</li>
                        </ul>

                        <h3 className="text-lg font-semibold mt-4 mb-2">Finalidades Secundarias (opcionales)</h3>
                        <ul>
                            <li>Enviarte promociones, ofertas y contenido de tu interés</li>
                            <li>Realizar encuestas de satisfacción</li>
                            <li>Personalizar tu experiencia en nuestro sitio web</li>
                            <li>Fines estadísticos y de mejora de nuestros servicios</li>
                        </ul>
                        <p className="text-sm text-gray-600 mt-4">
                            Puedes negarte a que usemos tus datos para finalidades secundarias enviando un correo a <a href="mailto:privacidad@trefa.mx">privacidad@trefa.mx</a>.
                        </p>
                    </section>

                    {/* Section: Derechos ARCO */}
                    <section className="mb-12">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Lock className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mt-0 mb-3">Tus Derechos ARCO</h2>
                                <p>Tienes derecho a:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-primary-600 mb-1">A - Acceso</h4>
                                        <p className="text-sm text-gray-600">Conocer qué datos personales tenemos sobre ti y cómo los usamos.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-primary-600 mb-1">R - Rectificación</h4>
                                        <p className="text-sm text-gray-600">Solicitar la corrección de tus datos si están incompletos o erróneos.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-primary-600 mb-1">C - Cancelación</h4>
                                        <p className="text-sm text-gray-600">Pedir que eliminemos tus datos cuando ya no sean necesarios.</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <h4 className="font-bold text-primary-600 mb-1">O - Oposición</h4>
                                        <p className="text-sm text-gray-600">Oponerte al tratamiento de tus datos para ciertas finalidades.</p>
                                    </div>
                                </div>
                                <p className="mt-4">
                                    Para ejercer cualquiera de estos derechos, envía tu solicitud a <a href="mailto:privacidad@trefa.mx">privacidad@trefa.mx</a> incluyendo:
                                </p>
                                <ul>
                                    <li>Tu nombre completo</li>
                                    <li>Copia de tu identificación oficial</li>
                                    <li>Descripción clara de lo que solicitas</li>
                                    <li>Correo electrónico para notificaciones</li>
                                </ul>
                                <p>Responderemos tu solicitud en un máximo de 20 días hábiles.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section: Transferencias */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Transferencia de Datos</h2>
                        <p>Tus datos personales pueden ser compartidos con:</p>
                        <ul>
                            <li><strong>Instituciones financieras:</strong> Para procesar solicitudes de crédito automotriz</li>
                            <li><strong>Autoridades competentes:</strong> Cuando sea requerido por ley</li>
                            <li><strong>Proveedores de servicios tecnológicos:</strong> Que nos ayudan a operar nuestro sitio web (hosting, analytics, comunicación)</li>
                        </ul>
                        <p>Todas las transferencias se realizan bajo estrictos contratos de confidencialidad y cumpliendo la legislación aplicable.</p>
                    </section>

                    {/* Section: Seguridad */}
                    <section className="mb-12 p-6 bg-gray-50 rounded-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mt-0 mb-3">Medidas de Seguridad</h2>
                        <p>Implementamos medidas técnicas, administrativas y físicas para proteger tus datos:</p>
                        <ul>
                            <li>Cifrado SSL/TLS en todas las transmisiones de datos</li>
                            <li>Acceso restringido solo a personal autorizado</li>
                            <li>Monitoreo continuo de seguridad</li>
                            <li>Copias de seguridad periódicas</li>
                            <li>Políticas internas de manejo de información confidencial</li>
                        </ul>
                    </section>

                    {/* Section: Cookies */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Uso de Cookies</h2>
                        <p>Utilizamos cookies para mejorar tu experiencia de navegación. Puedes gestionar tus preferencias de cookies desde la configuración de tu navegador.</p>
                        <p>Para más información, consulta nuestra <Link href="/politica-de-privacidad" className="text-primary-600 hover:underline">Política de Privacidad</Link>.</p>
                    </section>

                    {/* Section: Cambios */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Cambios a este Aviso</h2>
                        <p>Nos reservamos el derecho de modificar este Aviso de Protección de Datos en cualquier momento. Cualquier cambio será publicado en esta página con la fecha de actualización correspondiente.</p>
                    </section>

                    {/* Contact CTA */}
                    <section className="text-center p-8 bg-primary-50 rounded-2xl">
                        <h2 className="text-2xl font-bold text-gray-900 mt-0 mb-3">¿Tienes dudas sobre tus datos?</h2>
                        <p className="mb-6">Nuestro equipo de privacidad está disponible para ayudarte.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="mailto:privacidad@trefa.mx"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors no-underline"
                            >
                                <Mail className="w-5 h-5" />
                                Contactar Privacidad
                            </a>
                            <Link
                                href="/contacto"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full border border-gray-300 hover:bg-gray-50 transition-colors no-underline"
                            >
                                <Phone className="w-5 h-5" />
                                Contacto General
                            </Link>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
};

export default ProteccionDatosPage;
