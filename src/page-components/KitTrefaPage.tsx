'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShieldCheck, TrendingUp, Award, Car, DollarSign, FileText, Wrench, Check, X, ArrowRight, Star } from 'lucide-react';
import { proxyImage } from '../utils/proxyImage';
import { useVehicles } from '../context/VehicleContext';
import type { Vehicle } from '../types/types';
import { getVehicleImage } from '../utils/getVehicleImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import LazyImage from '../components/LazyImage';
import { formatPrice } from '../utils/formatters';

const benefitsData = [
    {
        icon: Award,
        title: '1. Compromiso de Calidad TREFA',
        description: 'Nuestro compromiso con la calidad es total, y lo demostramos con hechos. Confiamos tanto en nuestro riguroso proceso de inspección de 150 puntos que si tu auto presenta una falla mecánica en los primeros 30 días o 500 km (lo que ocurra primero), te devolvemos el 100% de tu dinero o lo reparamos sin costo.',
        value: 'Tranquilidad Absoluta.',
        details: []
    },
    {
        icon: FileText,
        title: '2. Certificado de Procedencia Segura',
        description: 'Garantizamos el pasado de tu auto para que tú te enfoques en su futuro. Este certificado es la prueba irrefutable de que el auto pasó nuestra rigurosa investigación legal y administrativa, que incluye:',
        value: '$3,500 MXN',
        details: [
            'Validación en REPUVE, SAT, Totalcheck y TransUnion.',
            'Inspección física forense de números de serie en chasis y motor.',
            'Auditoría documental de facturas y refrendos.',
            'Liquidación de cualquier adeudo en el Instituto de Control Vehicular.'
        ]
    },
    {
        icon: ShieldCheck,
        title: '3. Garantía Blindada con Cobertura de $100,000',
        description: 'Te protegemos contra las reparaciones más catastróficas. Tu auto está cubierto en motor y transmisión con una bolsa de protección de hasta $100,000 pesos durante un año completo. Conduce con la certeza de que estás blindado incluso contra el peor escenario.',
        value: 'Protección de $100,000 MXN',
        details: []
    },
    {
        icon: TrendingUp,
        title: '4. Programa de Recompra Garantizada TREFA',
        description: 'A través de este programa oficial, eliminamos la incertidumbre financiera. Te garantizamos por escrito la recompra de tu auto por el 80% de su valor el primer año y el 70% el segundo. Este beneficio aplica para autos con un uso de hasta 20,000 km por año, conservados en condiciones de uso normales y que cumplan con las políticas de compra vigentes de TREFA al momento de la transacción.',
        value: 'Protección Invaluable.',
        details: []
    },
    {
        icon: Wrench,
        title: '5. "Check-up de Confianza TREFA"',
        description: 'A los 6 meses o 10,000 km, te incluimos una inspección multipunto de seguridad sin costo. Nuestro equipo de expertos revisará los puntos vitales de tu auto (frenos, suspensión, niveles, neumáticos y componentes de seguridad) para asegurar que sigue funcionando en perfectas condiciones y prevenir problemas futuros.',
        value: '$4,000 MXN',
        details: []
    },
    {
        icon: Car,
        title: '6. Bono de Movilidad Garantizada',
        description: 'Tu vida no se detiene. Si tu auto ingresa a nuestro taller por garantía, te damos $250 pesos diarios para tus traslados, asegurando que tu rutina continúe sin interrupciones.',
        value: '$7,500 MXN',
        details: []
    },
    {
        icon: DollarSign,
        title: '7. Bono de Tranquilidad Financiera',
        description: 'Si tu auto está financiado, no tienes por qué pagar por él mientras está en nuestro taller por garantía. Nosotros cubrimos el equivalente a tu mensualidad promedio para aliviar esa carga.',
        value: '$8,500 MXN',
        details: []
    }
];

const comparisonData = [
    { feature: 'Compromiso de Calidad (30 días)', trefa: true, agencia: false, particular: false },
    { feature: 'Certificado de Procedencia Segura', trefa: true, agencia: 'parcial', particular: false },
    { feature: 'Garantía Blindada en Motor y Transmisión', trefa: true, agencia: 'limitada', particular: false },
    { feature: 'Recompra Garantizada por Contrato', trefa: true, agencia: false, particular: false },
    { feature: 'Check-up de Confianza a los 6 meses', trefa: true, agencia: false, particular: false },
    { feature: 'Apoyo para Movilidad durante Garantía', trefa: true, agencia: false, particular: false },
    { feature: 'Apoyo en Mensualidad durante Garantía', trefa: true, agencia: false, particular: false },
    { feature: 'Riesgo de Fraude o Vicios Ocultos', trefa: 'nulo', agencia: 'bajo', particular: 'alto' },
];

const Checkmark: React.FC<{ status: boolean | string }> = ({ status }) => {
    if (status === true) return <Check className="w-6 h-6 text-green-500 mx-auto" />;
    if (status === false) return <X className="w-6 h-6 text-red-500 mx-auto" />;
    if (status === 'parcial') return <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">Parcial</span>;
    if (status === 'limitada') return <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">Limitada</span>;
    if (status === 'nulo') return <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full">NULO</span>;
    if (status === 'bajo') return <span className="text-xs font-bold text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">Bajo</span>;
    if (status === 'alto') return <span className="text-xs font-bold text-red-800 bg-red-100 px-2 py-1 rounded-full">ALTO</span>;
    return null;
};

/* ---------- Vehicle Card Components ---------- */
const MasonryVehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
    const imageSrc = getVehicleImage(vehicle);
    const isPopular = vehicle.view_count >= 1000;
    return (
        <Link href={`/autos/${vehicle.slug}`} className="group block relative z-10">
            <div className={`relative ${!isPopular ? 'overflow-hidden' : ''} rounded-lg shadow-md hover:shadow-xl transition-shadow ${isPopular ? 'popular-card' : ''}`}>
                <div className={`aspect-[4/3] bg-gray-100 ${isPopular ? 'overflow-hidden rounded-t-lg' : ''}`}>
                    <LazyImage
                        src={imageSrc}
                        alt={vehicle.titulo}
                        className="w-full h-full"
                        objectFit="cover"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                    <h4 className="text-white font-semibold text-sm truncate drop-shadow-md" title={vehicle.titulo}>
                        {vehicle.titulo}
                    </h4>
                    <p className="text-white font-bold text-base drop-shadow-md">
                        {formatPrice(vehicle.precio)}
                    </p>
                </div>
            </div>
        </Link>
    );
};

/* ---------- Horizontal Slider ---------- */
const HorizontalSlider: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (containerRef.current) {
            const scrollAmount = 300;
            const newPosition = direction === 'left'
                ? scrollPosition - scrollAmount
                : scrollPosition + scrollAmount;
            containerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
            setScrollPosition(newPosition);
        }
    };

    if (vehicles.length === 0) return null;

    return (
        <div className="relative">
            {vehicles.length > 2 && (
                <>
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                        aria-label="Scroll left"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg"
                        aria-label="Scroll right"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}
            <div
                ref={containerRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex-shrink-0 w-48 snap-start">
                        <MasonryVehicleCard vehicle={vehicle} />
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ---------- Single Card Slider ---------- */
const SingleCardSlider: React.FC<{ vehicles: Vehicle[] }> = ({ vehicles }) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? vehicles.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === vehicles.length - 1 ? 0 : prevIndex + 1
        );
    };

    if (vehicles.length === 0) return null;

    const currentVehicle = vehicles[currentIndex];

    return (
        <div className="relative">
            <div className="relative">
                <MasonryVehicleCard vehicle={currentVehicle} />
            </div>

            {vehicles.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        aria-label="Previous vehicle"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        aria-label="Next vehicle"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-2 mt-4">
                        {vehicles.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentIndex
                                        ? 'bg-primary w-4'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                                aria-label={`Go to vehicle ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};


const KitTrefaPage: React.FC = () => {
    // SEO metadata is handled in the page.tsx file in Next.js

    const { vehicles: allVehicles, isLoading } = useVehicles();
    const [displayVehicles, setDisplayVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        if (allVehicles && allVehicles.length > 0) {
            const available = allVehicles.filter(v =>
                !v.separado &&
                !v.vendido &&
                getVehicleImage(v) !== DEFAULT_PLACEHOLDER_IMAGE
            );
            const shuffled = [...available].sort(() => 0.5 - Math.random());
            setDisplayVehicles(shuffled);
        }
    }, [allVehicles]);

    // Filter vehicles by body type
    const suvVehicles = useMemo(() =>
        displayVehicles.filter(v => {
            const type = v.carroceria?.toLowerCase() || '';
            return type.includes('suv');
        }).slice(0, 10),
        [displayVehicles]
    );

    const sedanVehicles = useMemo(() =>
        displayVehicles.filter(v => {
            const type = v.carroceria?.toLowerCase() || '';
            return type.includes('sedan') || type.includes('sedán');
        }),
        [displayVehicles]
    );

    const hatchbackVehicles = useMemo(() =>
        displayVehicles.filter(v => {
            const type = v.carroceria?.toLowerCase() || '';
            return type.includes('hatch') || type.includes('compacto') || type.includes('compact');
        }),
        [displayVehicles]
    );

    const pickupVehicles = useMemo(() =>
        displayVehicles.filter(v => {
            const type = v.carroceria?.toLowerCase() || '';
            return type.includes('pick') || type.includes('pickup') || type.includes('camioneta');
        }).slice(0, 15),
        [displayVehicles]
    );

    const tableData = [
        { label: "Certificado de Procedencia Segura", value: "$3,500" },
        { label: "Check-up de Confianza TREFA", value: "$4,000" },
        { label: "Bono de Movilidad Garantizada", value: "$7,500" },
        { label: "Bono de Tranquilidad Financiera", value: "$8,500" },
        { label: "Garantía Blindada con Cobertura", value: "$100,000" }
    ];

    const totalValue = "$123,500 MXN";

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 md:py-32">
                {/* Decorative background elements */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-1/4 -left-24 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
                    <div className="absolute top-1/2 -right-24 w-72 h-72 bg-secondary/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary/20 translate-y-1/2 w-[80%] h-96" />

                <div className="container mx-auto px-4 lg:px-6 relative z-10 text-center">
                    <span className="px-4 py-1 bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/30 hover:from-primary/20 hover:to-secondary/10 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md rounded-full inline-flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-primary" />
                        <span className="text-sm font-medium">Incluido en Cada Auto</span>
                    </span>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="font-heading text-4xl md:text-6xl font-bold tracking-tight mt-6"
                    >
                        El Kit de Seguridad TREFA
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                        className="mt-6 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                    >
                        Incluido en <strong className="text-foreground">CADA</strong> auto que vendemos, sin costo adicional. No es una promoción, es nuestra promesa estándar para garantizar tu total tranquilidad.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
                    >
                        <Link href="/autos" className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-lg font-semibold shadow-lg transition-all">
                            Ver Inventario Certificado
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>
            
            {/* Comparison Section */}
            <section className="py-20 md:py-32 bg-muted/50">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold">La Diferencia TREFA es Abismal</h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Compara los beneficios que obtienes con nosotros frente a las alternativas tradicionales. Tu tranquilidad no es negociable.
                        </p>
                    </div>

                    {/* Feature-by-Feature Comparison */}
                    <div className="max-w-6xl mx-auto space-y-4">
                        {comparisonData.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                viewport={{ once: true }}
                                className="bg-background rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                                    {/* Feature Name */}
                                    <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 md:p-6 flex items-center border-b md:border-b-0 md:border-r border-border">
                                        <h3 className="font-semibold text-foreground text-sm md:text-base">
                                            {item.feature}
                                        </h3>
                                    </div>

                                    {/* TREFA Column */}
                                    <div className="p-4 md:p-6 flex items-center justify-center bg-primary/5 border-b md:border-b-0 md:border-r border-border">
                                        <div className="text-center">
                                            <div className="mb-1 text-xs font-semibold text-primary uppercase tracking-wide">TREFA</div>
                                            <Checkmark status={item.trefa} />
                                        </div>
                                    </div>

                                    {/* Otra Agencia Column */}
                                    <div className="p-4 md:p-6 flex items-center justify-center bg-orange-50/50 border-b md:border-b-0 md:border-r border-border">
                                        <div className="text-center">
                                            <div className="mb-1 text-xs font-semibold text-orange-600 uppercase tracking-wide">Otra Agencia</div>
                                            <Checkmark status={item.agencia} />
                                        </div>
                                    </div>

                                    {/* Vendedor Particular Column */}
                                    <div className="p-4 md:p-6 flex items-center justify-center bg-red-50/50">
                                        <div className="text-center">
                                            <div className="mb-1 text-xs font-semibold text-red-600 uppercase tracking-wide">Particular</div>
                                            <Checkmark status={item.particular} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
                        {/* TREFA Card */}
                        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary rounded-xl p-6 shadow-lg">
                            <div className="absolute -top-3 -right-3 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                ✓ Recomendado
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-primary mb-2">TREFA</h3>
                                <p className="text-sm text-muted-foreground mb-4">Máxima seguridad y tranquilidad</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="text-3xl font-bold text-primary">
                                        {comparisonData.filter(item => item.trefa === true).length}
                                    </div>
                                    <div className="text-sm text-muted-foreground">beneficios<br/>completos</div>
                                </div>
                            </div>
                        </div>

                        {/* Otra Agencia Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-50/50 border-2 border-orange-200 rounded-xl p-6 shadow-md">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Award className="w-8 h-8 text-orange-600" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-orange-700 mb-2">Otra Agencia</h3>
                                <p className="text-sm text-orange-600 mb-4">Beneficios parciales o limitados</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="text-3xl font-bold text-orange-700">
                                        {comparisonData.filter(item => item.agencia === true || item.agencia === 'parcial' || item.agencia === 'limitada').length}
                                    </div>
                                    <div className="text-sm text-orange-600">beneficios<br/>incompletos</div>
                                </div>
                            </div>
                        </div>

                        {/* Vendedor Particular Card */}
                        <div className="bg-gradient-to-br from-red-50 to-red-50/50 border-2 border-red-200 rounded-xl p-6 shadow-md">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="font-heading text-xl font-bold text-red-700 mb-2">Vendedor Particular</h3>
                                <p className="text-sm text-red-600 mb-4">Sin protección ni garantías</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="text-3xl font-bold text-red-700">
                                        {comparisonData.filter(item => item.particular === true).length}
                                    </div>
                                    <div className="text-sm text-red-600">beneficios<br/>disponibles</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Details Section */}
            <section className="py-20 md:py-32 bg-background">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold">Cada Beneficio, Explicado</h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Conoce en detalle cada uno de los componentes que hacen del Kit de Seguridad TREFA único en el mercado
                        </p>
                    </div>
                    <div className="max-w-5xl mx-auto space-y-6">
                        {benefitsData.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl shadow-lg border border-primary/10 overflow-hidden hover:shadow-xl transition-all duration-300">
                                    <div className="p-6 md:p-8">
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Icon and Number */}
                                            <div className="flex-shrink-0">
                                                <div className="relative">
                                                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                        <benefit.icon className="w-8 h-8" />
                                                    </div>
                                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-grow space-y-3">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                                                    <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground">
                                                        {benefit.title}
                                                    </h3>
                                                    <div className="flex-shrink-0">
                                                        <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold">
                                                            {benefit.value}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-muted-foreground leading-relaxed text-base">
                                                    {benefit.description}
                                                </p>

                                                {benefit.details && benefit.details.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-border">
                                                        <ul className="grid md:grid-cols-2 gap-2">
                                                            {benefit.details.map((detail, idx) => (
                                                                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                                    <span>{detail}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom accent bar */}
                                    <div className="h-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/70 group-hover:to-primary/40 transition-all duration-300"></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Summary Section */}
            <section className="py-20 md:py-32 bg-muted/50">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
                        <div>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">Un Valor que Puedes Medir</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                El Kit de Seguridad TREFA no es solo una promesa, es un paquete de beneficios tangibles que suman un valor real a tu compra, dándote una protección que no encontrarás en ningún otro lugar.
                            </p>
                            <div className="mt-8 overflow-hidden rounded-xl border border-border shadow-lg bg-background">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-muted">
                                            <th className="p-4 text-sm font-semibold uppercase text-muted-foreground">Beneficio</th>
                                            <th className="p-4 text-sm font-semibold uppercase text-muted-foreground text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((row, index) => (
                                            <tr key={index} className="border-t border-border hover:bg-muted/50 transition-colors">
                                                <td className="p-4 text-foreground">{row.label}</td>
                                                <td className="p-4 text-foreground font-medium text-right">{row.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-primary/10 border-t-2 border-primary/30">
                                            <td className="p-4 font-bold text-primary uppercase">VALOR TOTAL:</td>
                                            <td className="p-4 font-extrabold text-primary text-right text-lg">{totalValue}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="text-center lg:order-last">
                            <img
                                src="https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp"
                                alt="Vehículo TREFA con Kit de Seguridad"
                                className="max-w-md mx-auto w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Vehicle Showcase Section */}
            <section className="py-20 md:py-32 bg-background">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold">
                            Todos Nuestros Autos Incluyen el Kit
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            SUVs, Sedanes, Hatchbacks y Pick Ups certificados con el Kit de Seguridad TREFA incluido
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* SUVs Premium - 5 Visible Cards */}
                        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 shadow-lg md:col-span-3">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Car className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-semibold text-2xl">SUVs Premium Certificados</h3>
                                        <p className="text-muted-foreground">Amplia selección con Kit de Seguridad TREFA</p>
                                    </div>
                                </div>
                                <Link href="/autos?carroceria=SUV" className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-semibold">
                                    Ver todos →
                                </Link>
                            </div>
                            {suvVehicles.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {suvVehicles.slice(0, 5).map((vehicle) => (
                                        <MasonryVehicleCard key={vehicle.id} vehicle={vehicle} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">Actualizando selección de SUVs...</p>
                            )}
                        </div>

                        {/* Merged Hatchbacks and Sedanes - Horizontal Sliders */}
                        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 shadow-lg md:col-span-2 space-y-8">
                            {/* Hatchbacks Section */}
                            <div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Car className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-semibold text-xl">Hatchbacks</h3>
                                        <p className="text-muted-foreground text-sm">Perfectos para la ciudad</p>
                                    </div>
                                </div>
                                {hatchbackVehicles.length > 0 ? (
                                    <HorizontalSlider vehicles={hatchbackVehicles} />
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">Actualizando selección de Hatchbacks...</p>
                                )}
                                <Link href="/autos?carroceria=Hatchback" className="mt-4 inline-block text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm">
                                    Ver todos →
                                </Link>
                            </div>

                            {/* Sedanes Section */}
                            <div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Star className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-heading font-semibold text-xl">Sedanes</h3>
                                        <p className="text-muted-foreground text-sm">Elegancia y confort certificados</p>
                                    </div>
                                </div>
                                {sedanVehicles.length > 0 ? (
                                    <HorizontalSlider vehicles={sedanVehicles} />
                                ) : (
                                    <p className="text-muted-foreground text-center py-8">Actualizando selección de Sedanes...</p>
                                )}
                                <Link href="/autos?carroceria=Sedan" className="mt-4 inline-block text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm">
                                    Ver todos →
                                </Link>
                            </div>
                        </div>

                        {/* Pick Ups - Single Card Slider */}
                        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 shadow-lg md:row-span-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Car className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-semibold text-xl">Pick Ups</h3>
                                    <p className="text-muted-foreground text-sm">Potencia y capacidad</p>
                                </div>
                            </div>
                            {pickupVehicles.length > 0 ? (
                                <SingleCardSlider vehicles={pickupVehicles} />
                            ) : (
                                <p className="text-muted-foreground text-center py-8">Actualizando selección de Pick Ups...</p>
                            )}
                            <Link href="/autos?carroceria=Pick Up" className="mt-4 inline-block text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-semibold text-sm w-full text-center">
                                Ver todos →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials - Wall of Love */}
            <section className="py-20 bg-muted/50 md:py-32">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold">
                            Lo Que Dicen Nuestros Clientes
                        </h2>
                        <p className="text-xl text-muted-foreground mx-auto">
                            Más de 500 familias han encontrado su auto ideal con el Kit de Seguridad TREFA
                        </p>
                    </div>
                    <div className="grid gap-8">
                        <div className="grid lg:grid-cols-3 gap-8">
                            {[
                                {
                                    name: 'María González',
                                    vehicle: 'Honda CR-V 2021',
                                    text: 'Excelente servicio desde el primer contacto. Mi Honda CR-V 2021 llegó en perfectas condiciones y el financiamiento fue muy accesible. El Kit de Seguridad TREFA me da mucha tranquilidad.'
                                },
                                {
                                    name: 'Carlos Ramírez',
                                    vehicle: 'Nissan Frontier 2020',
                                    text: 'El proceso de intercambio fue muy transparente. Recibí un precio justo por mi auto anterior y encontré la pick-up perfecta para mi negocio. La garantía blindada es excelente.'
                                },
                                {
                                    name: 'Ana López',
                                    vehicle: 'Mazda CX-5 2022',
                                    text: 'Como madre soltera, necesitaba un auto confiable y económico. El equipo de TREFA me ayudó a encontrar el financiamiento perfecto y saber que tengo el certificado de procedencia me da mucha paz.'
                                }
                            ].map((testimonial, index) => (
                                <div key={index} className="bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg rounded-xl p-6">
                                    <div className="flex items-center space-x-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star key={star} className="w-5 h-5 text-primary fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground mb-6">
                                        "{testimonial.text}"
                                    </p>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <span className="text-primary font-bold">{testimonial.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <div className="font-semibold">{testimonial.name}</div>
                                            <div className="text-sm text-muted-foreground">{testimonial.vehicle}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 md:py-32 bg-primary relative overflow-hidden">
                <div className="container mx-auto px-4 lg:px-6">
                    <div className="text-center space-y-8 max-w-3xl mx-auto relative z-10">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white">
                            Tu Próximo Auto te Espera con Todo Incluido
                        </h2>
                        <p className="text-xl text-white/95 leading-relaxed">
                            No dejes tu inversión al azar. Elige la certeza y la tranquilidad que solo TREFA te puede ofrecer. Cada auto incluye el Kit de Seguridad valorado en $123,500 MXN sin costo adicional.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link href="/autos" className="inline-flex items-center justify-center gap-2 bg-white text-primary hover:bg-white/95 px-8 py-4 rounded-lg font-bold shadow-xl transition-all hover:scale-105 text-lg">
                                Explorar Autos con Kit de Seguridad
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/contacto" className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 border-2 border-white text-white px-8 py-4 rounded-lg font-bold transition-all hover:scale-105 text-lg">
                                Contactar Asesor
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                        <p className="text-sm text-white/80 pt-4">
                            Financiamiento disponible • Garantía incluida • Inspección de 150 puntos
                        </p>
                    </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-white/10 w-[80%] translate-y-1/2 h-64" />
            </section>
        </div>
    );
};

export default KitTrefaPage;