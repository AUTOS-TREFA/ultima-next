'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { 
  Play,
  CheckCircle,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Sparkles,
  Zap,
  Star,
  Sun,
  Moon
} from 'lucide-react';
// import { WebhookService } from '../services/webhookService'; // TODO: File doesn't exist

const formSchema = z.object({
  fullName: z.string().min(2, 'Nombre completo requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  monthlyIncome: z.string().min(1, 'Ingreso mensual requerido'),
  acceptTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones'),
  isOver21: z.boolean().refine(val => val === true, 'Debes ser mayor de 21 años')
});

type FormData = z.infer<typeof formSchema>;

const LandingPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isLightTheme, setIsLightTheme] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: FormData) => {
    setSubmissionStatus('submitting');
    
    try {
      console.log('📝 Submitting landing page form:', data);
      
      // Send to new webhook URL
      const payload = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        monthlyIncome: data.monthlyIncome,
        acceptTerms: data.acceptTerms,
        isOver21: data.isOver21,
        timestamp: new Date().toISOString(),
        source: 'landing-page-form',
        userAgent: navigator.userAgent,
        referrer: document.referrer || window.location.href
      };

      const response = await fetch('https://services.leadconnectorhq.com/hooks/LJhjk6eFZEHwptjuIF0a/webhook-trigger/eprKrEBZDa2DNegPGQ3T', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'TREFA-Portal/1.0',
          'X-Source': 'TREFA-Landing-Page'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Webhook sent successfully');
        setSubmissionStatus('success');
        
        // Show success message for 2 seconds, then redirect to portal.trefa.mx
        setTimeout(() => {
          window.location.href = 'https://portal.trefa.mx/clientes';
        }, 2000);
      } else {
        console.error('❌ Webhook failed:', response.status);
        setSubmissionStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmissionStatus('error');
    } finally {
      // Don't reset submitting state here - let success/error states handle it
    }
  };

  const handleVideoPlay = () => {
    setVideoPlaying(true);
  };

  // Success State
  if (submissionStatus === 'success') {
    return (
      <div className={`min-h-screen ${isLightTheme ? 'bg-gradient-to-br from-blue-50 via-white to-orange-50' : 'bg-gradient-to-br from-gray-900 via-black to-gray-900'} relative overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 left-20 w-96 h-96 bg-gradient-to-r ${isLightTheme ? 'from-green-200/40 to-emerald-200/40' : 'from-green-500/20 to-emerald-500/20'} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r ${isLightTheme ? 'from-trefa-200/40 to-orange-200/40' : 'from-trefa-500/20 to-orange-500/20'} rounded-full blur-3xl animate-pulse`}></div>
        </div>

        <div className="relative text-center px-4 max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className={`text-4xl sm:text-5xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-4`}>
            ¡Información Enviada!
          </h1>
          
          <p className={`text-xl ${isLightTheme ? 'text-gray-700' : 'text-white/80'} mb-8 leading-relaxed`}>
            Te contactaremos en las próximas 24 horas con las mejores opciones de financiamiento.
          </p>
          
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isLightTheme ? 'border-gray-900' : 'border-white'} mx-auto mb-4`}></div>
          <p className={isLightTheme ? 'text-gray-600' : 'text-white/60'}>Redirigiendo a tu panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isLightTheme ? 'bg-gradient-to-br from-blue-50 via-white to-orange-50' : 'bg-gradient-to-br from-gray-900 via-black to-gray-900'} relative overflow-hidden`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <div className={`absolute top-20 left-20 w-96 h-96 bg-gradient-to-r ${isLightTheme ? 'from-trefa-300/30 to-orange-300/30' : 'from-trefa-500/20 to-orange-500/20'} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r ${isLightTheme ? 'from-blue-300/25 to-purple-300/25' : 'from-blue-500/15 to-purple-500/15'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r ${isLightTheme ? 'from-trefa-200/25 to-yellow-200/25' : 'from-trefa-400/10 to-yellow-400/10'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Sparkles */}
        <div className="absolute top-1/4 left-1/4 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
          <Sparkles className={`w-6 h-6 ${isLightTheme ? 'text-trefa-500/60' : 'text-trefa-400/60'}`} />
        </div>
        <div className="absolute top-3/4 right-1/4 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4s' }}>
          <Star className={`w-8 h-8 ${isLightTheme ? 'text-yellow-500/60' : 'text-yellow-400/50'}`} />
        </div>
        <div className="absolute top-1/2 right-1/3 animate-bounce" style={{ animationDelay: '2.5s', animationDuration: '3.5s' }}>
          <Zap className={`w-5 h-5 ${isLightTheme ? 'text-blue-500/60' : 'text-blue-400/60'}`} />
        </div>
      </div>

      {/* Header */}
      <header className={`relative z-50 ${isLightTheme ? 'bg-white/20 backdrop-blur-xl border-b border-white/30 shadow-lg' : 'bg-black/10 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/Logo TREFA blanco.png" 
                alt="TREFA" 
                className={`h-10 sm:h-12 lg:h-16 w-auto ${isLightTheme ? 'filter brightness-0 saturate-100% invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)' : ''}`}
              />
            </div>
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsLightTheme(!isLightTheme)}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isLightTheme 
                    ? 'bg-white/60 backdrop-blur-md text-trefa-700 hover:bg-white/80 border border-white/40 shadow-lg' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                title={isLightTheme ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
              >
                {isLightTheme ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              
              {/* GitHub Link */}
              <a
                href="https://github.com/trefa-mx/portal-financiero"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 transition-colors ${
                  isLightTheme 
                    ? 'text-trefa-600 hover:text-trefa-800' 
                    : 'text-white/60 hover:text-white'
                }`}
                title="Ver código en GitHub"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              
              <Link
                href="/auth"
                className={`text-sm font-medium transition-colors backdrop-blur-sm px-3 py-2 rounded-full border ${
                  isLightTheme 
                    ? 'text-trefa-700 hover:text-trefa-900 bg-white/60 border-white/40 hover:bg-white/80 shadow-lg' 
                    : 'text-white/80 hover:text-white bg-white/10 border-white/20'
                }`}
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center py-8 sm:py-12 lg:py-16">
        {/* Large Expert Image - Desktop Only */}
        <div className="hidden xl:block absolute left-8 top-1/2 transform -translate-y-1/2 w-[400px] xl:w-[500px] h-[calc(100vh-120px)] max-h-[600px] xl:max-h-[700px] opacity-30 xl:opacity-40 pointer-events-none z-0">
          <div className="relative h-full">
            <div className={`absolute -inset-8 bg-gradient-to-r ${isLightTheme ? 'from-trefa-400/40 via-orange-400/40 to-yellow-400/40' : 'from-trefa-500/20 via-orange-500/20 to-yellow-500/20'} rounded-3xl blur-3xl animate-pulse`}></div>
            <div className={`relative h-full backdrop-blur-sm ${isLightTheme ? 'bg-white/30 border-white/40' : 'bg-white/5 border-white/10'} rounded-3xl p-8 border shadow-2xl flex items-end`}>
              <img 
                src="/ferAsset 10-8.png" 
                alt="Fernando - Experto Financiero TREFA" 
                className="w-full h-full object-contain object-left-bottom animate-float"
              />
            </div>
          </div>
        </div>
        
        {/* Right Side Graphic - Desktop Only */}
        <div className="hidden xl:block absolute right-8 top-1/2 transform -translate-y-1/2 w-[300px] xl:w-[400px] h-[calc(100vh-120px)] max-h-[500px] xl:max-h-[600px] opacity-40 xl:opacity-50 pointer-events-none z-0">
          <div className="relative h-full">
            <div className={`absolute -inset-6 bg-gradient-to-r ${isLightTheme ? 'from-blue-300/30 via-purple-300/30 to-pink-300/30' : 'from-blue-500/20 via-purple-500/20 to-pink-500/20'} rounded-3xl blur-3xl animate-pulse`} style={{ animationDelay: '1s' }}></div>
            <div className={`relative h-full backdrop-blur-sm ${isLightTheme ? 'bg-white/40 border-white/50' : 'bg-white/5 border-white/10'} rounded-3xl p-6 border shadow-2xl flex items-center justify-center`}>
              <img 
                src="/trefa graphicosArtboard 6trefa gra.png" 
                alt="TREFA Graphics" 
                className="w-full h-full object-contain animate-float"
                style={{ animationDelay: '2s' }}
              />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          
          {/* Massive Headline */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16 px-2 sm:px-4">
            <h1 className="font-inter text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black leading-tight tracking-tight mb-6 sm:mb-8 lg:mb-12 mt-4 sm:mt-6 lg:mt-8">
              <span className={`block ${isLightTheme ? 'text-gray-900 drop-shadow-lg' : 'text-white drop-shadow-xl'} mb-2 sm:mb-4 animate-fade-in-up`} style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>El financiamiento ideal para tu nuevo auto </span>
              <span className={`block bg-gradient-to-r ${isLightTheme ? 'from-trefa-600 via-orange-500 to-yellow-500' : 'from-trefa-400 via-orange-400 to-yellow-400'} bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%] animate-fade-in-up`} style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
            en 24 horas o menos
              </span>
              <span className={`block ${isLightTheme ? 'text-gray-700 drop-shadow-md' : 'text-white/90 drop-shadow-xl'} text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-light mt-2 sm:mt-3 lg:mt-4 animate-fade-in-up`} style={{ animationDelay: '1.0s', animationFillMode: 'both' }}></span>
            </h1>
            
            <p className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl ${isLightTheme ? 'text-gray-700' : 'text-white/80'} max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-light mt-6 sm:mt-8 lg:mt-12 animate-fade-in-up`} style={{ animationDelay: '1.4s', animationFillMode: 'both' }}>
              Conectamos tu perfil al banco con 
              <span className={`${isLightTheme ? 'text-trefa-700 font-bold' : 'text-trefa-300 font-medium'}`}> la mejor tasa de interés </span> y la mayor probabilidad de aprobar tu solicitud de crédito. 
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-start">
            
            {/* Video Player - Mobile First, Desktop Left */}
            <div className="relative order-1 lg:order-1">
              <div className="relative group">
                {/* Glowing Background */}
                <div className={`absolute -inset-1 sm:-inset-2 lg:-inset-4 bg-gradient-to-r ${isLightTheme ? 'from-trefa-500/60 via-orange-500/60 to-yellow-500/60' : 'from-trefa-500/40 via-orange-500/40 to-yellow-500/40'} rounded-lg sm:rounded-xl lg:rounded-2xl blur-sm sm:blur-lg lg:blur-xl group-hover:blur-lg sm:group-hover:blur-xl lg:group-hover:blur-2xl transition-all duration-500 animate-pulse`}></div>
                
                {/* Mobile Neon Edge */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${isLightTheme ? 'from-trefa-600/80 via-orange-600/80 to-yellow-600/80' : 'from-trefa-400/60 via-orange-400/60 to-yellow-400/60'} rounded-lg sm:rounded-xl blur-sm animate-pulse lg:hidden`}></div>
                
                {/* Glass Container */}
                <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/60 border-white/50 shadow-2xl' : 'bg-white/10 border-white/20'} rounded-lg sm:rounded-xl lg:rounded-2xl p-1 sm:p-2 lg:p-3 border shadow-2xl`}>
                  <div className={`relative aspect-video ${isLightTheme ? 'bg-gradient-to-br from-gray-50 to-trefa-50' : 'bg-black/50'} rounded-md sm:rounded-lg lg:rounded-xl overflow-hidden shadow-inner`}>
                    {!videoPlaying ? (
                      <div 
                        className={`absolute inset-0 ${isLightTheme ? 'bg-gradient-to-br from-white/60 via-trefa-50/80 to-orange-50/60' : 'bg-gradient-to-br from-gray-900/80 via-black/60 to-gray-900/80'} flex items-center justify-center cursor-pointer group/play backdrop-blur-sm`}
                        onClick={handleVideoPlay}
                        style={{
                          backgroundImage: 'url(/video-thumbnail.png)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {/* Dark overlay for better contrast */}
                        <div className={`absolute inset-0 ${isLightTheme ? 'bg-gradient-to-br from-trefa-500/20 to-orange-500/20' : 'bg-black/40'}`}></div>
                        
                        {/* Play Button with Glass Effect */}
                        <div className="relative z-10">
                          <div className={`absolute inset-0 bg-gradient-to-r ${isLightTheme ? 'from-trefa-600 to-orange-600' : 'from-trefa-500 to-orange-500'} rounded-full blur-xl opacity-60 group-hover/play:opacity-80 transition-opacity`}></div>
                          <div className={`relative w-12 sm:w-16 lg:w-24 h-12 sm:h-16 lg:h-24 ${isLightTheme ? 'bg-white/90 border-white/60 shadow-2xl' : 'bg-white/20 border-white/30'} backdrop-blur-md rounded-full flex items-center justify-center border shadow-2xl group-hover/play:scale-110 transition-all duration-300`}>
                            <Play className={`w-6 sm:w-8 lg:w-12 h-6 sm:h-8 lg:h-12 ${isLightTheme ? 'text-trefa-700' : 'text-white'} ml-1 drop-shadow-lg`} />
                          </div>
                        </div>
                        
                        {/* Video Info Overlay */}
                        <div className="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-2 sm:left-3 lg:left-4 right-2 sm:right-3 lg:right-4 z-10">
                          <div className={`backdrop-blur-md ${isLightTheme ? 'bg-white/80 border-white/60 shadow-lg' : 'bg-white/10 border-white/20'} rounded-md sm:rounded-lg p-2 sm:p-3 border`}>
                            <p className={`${isLightTheme ? 'text-gray-900 font-bold' : 'text-white'} font-semibold text-xs sm:text-sm lg:text-base mb-1`}>
                              ¿Por qué comprar un auto TREFA?
                            </p>
                            <p className={`${isLightTheme ? 'text-trefa-700 font-medium' : 'text-white/80'} text-xs sm:text-xs lg:text-xs`}>
                              ⏱️ 2 minutos • Beneficios, garantías y compromiso.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <iframe
                        src="https://drive.google.com/file/d/1IBSZR_3Y2qojcGMA5fZ2Ioht5969Mphb/preview"
                        className="w-full h-full rounded-md sm:rounded-lg lg:rounded-xl"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title="TREFA - Proceso de Financiamiento"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form - Mobile Second, Desktop Right */}
            <div className="order-2 lg:order-2 lg:ml-auto lg:max-w-md xl:max-w-lg w-full px-2 sm:px-0">
              <div className="relative">
                {/* Dazzling Graphic Element */}
                <div className="hidden lg:block absolute -top-8 -right-8 lg:-top-12 lg:-right-12 xl:-top-16 xl:-right-16 w-32 lg:w-40 xl:w-48 h-32 lg:h-40 xl:h-48 opacity-20 lg:opacity-30 pointer-events-none">
                  <div className="relative w-full h-full">
                    {/* Outer rotating ring with gradient */}
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${isLightTheme ? 'from-trefa-600 via-orange-600 to-yellow-600 opacity-50' : 'from-trefa-400 via-orange-400 to-yellow-400 opacity-30'} animate-spin`} style={{ animationDuration: '20s' }}></div>
                    <div className={`absolute inset-2 rounded-full bg-gradient-to-r ${isLightTheme ? 'from-purple-500 via-pink-500 to-red-500 opacity-40' : 'from-purple-400 via-pink-400 to-red-400 opacity-25'} animate-spin`} style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
                    <div className={`absolute inset-4 rounded-full bg-gradient-to-r ${isLightTheme ? 'from-blue-500 via-cyan-500 to-teal-500 opacity-35' : 'from-blue-400 via-cyan-400 to-teal-400 opacity-20'} animate-spin`} style={{ animationDuration: '10s' }}></div>
                    
                    {/* Inner pulsing core */}
                    <div className={`absolute inset-8 rounded-full bg-gradient-to-r ${isLightTheme ? 'from-white/60 to-trefa-400/60' : 'from-white/30 to-trefa-300/30'} animate-pulse`}></div>
                    
                    {/* Floating sparkles around the rings */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                      <Sparkles className={`w-2 sm:w-3 lg:w-4 h-2 sm:h-3 lg:h-4 ${isLightTheme ? 'text-yellow-600' : 'text-yellow-300'}`} />
                    </div>
                    <div className="absolute bottom-4 right-8 animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>
                      <Star className={`w-3 sm:w-4 lg:w-5 h-3 sm:h-4 lg:h-5 ${isLightTheme ? 'text-orange-600' : 'text-orange-300'}`} />
                    </div>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}>
                      <Zap className={`w-2 sm:w-2 lg:w-3 h-2 sm:h-2 lg:h-3 ${isLightTheme ? 'text-blue-600' : 'text-blue-300'}`} />
                    </div>
                    <div className="absolute right-4 top-1/4 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}>
                      <Sparkles className={`w-3 sm:w-4 lg:w-6 h-3 sm:h-4 lg:h-6 ${isLightTheme ? 'text-pink-600' : 'text-pink-300'}`} />
                    </div>
                  </div>
                </div>

                {/* Form Glass Container */}
                <div className={`backdrop-blur-xl ${isLightTheme ? 'bg-white/70 border-white/60 shadow-2xl' : 'bg-white/10 border-white/20'} rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border shadow-2xl w-full`}>
                  {isSubmitted ? (
                    <div className="text-center py-3 sm:py-4 lg:py-6 xl:py-8">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-xl opacity-60"></div>
                        <CheckCircle className="relative w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 text-green-400 mx-auto" />
                      </div>
                      <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2 sm:mb-3 lg:mb-4`}>¡Solicitud Enviada!</h3>
                      <p className={`${isLightTheme ? 'text-gray-700' : 'text-white/80'} text-xs sm:text-sm lg:text-base mb-3 sm:mb-4 lg:mb-6 leading-relaxed`}>
                        Te contactaremos en las próximas 24 horas con las mejores opciones de financiamiento.
                      </p>
                      <Link
                        href="/auth"
                        className="inline-flex items-center px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-trefa-500 to-orange-500 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm lg:text-base hover:shadow-2xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                      >
                        Crear Cuenta
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ml-1 sm:ml-2" />
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 lg:space-y-6">
                      <div className="text-center mb-4 sm:mb-6 lg:mb-8 xl:mb-10">
                        <h2 className={`text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2 sm:mb-3`}>
                          Regístrate en 1 minuto
                        </h2>
                        <p className={`${isLightTheme ? 'text-trefa-700 font-medium' : 'text-white/70'} text-xs sm:text-sm`}>
                          Sin compromiso de compra ni pagos por adelantado
                        </p>
                      </div>

                      {/* Simplified Form Fields */}
                      <div className="space-y-4 sm:space-y-5">
                        <div>
                          <input
                            {...register('fullName')}
                            placeholder="Nombre completo"
                            className={`w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 backdrop-blur-md border rounded-lg sm:rounded-xl transition-all text-sm sm:text-base shadow-lg ${
                              isLightTheme 
                                ? 'bg-white/80 border-white/60 text-gray-900 placeholder-gray-600 focus:bg-white/90 focus:ring-2 focus:ring-trefa-600 focus:border-trefa-600 shadow-xl' 
                                : 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-trefa-400 focus:border-transparent'
                            }`}
                          />
                          {errors.fullName && (
                            <p className={`${isLightTheme ? 'text-red-600' : 'text-red-400'} text-xs mt-2 ml-2`}>{errors.fullName.message}</p>
                          )}
                        </div>

                        <div>
                          <input
                            {...register('email')}
                            type="email"
                            placeholder="Correo electrónico"
                            className={`w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 backdrop-blur-md border rounded-lg sm:rounded-xl transition-all text-sm sm:text-base shadow-lg ${
                              isLightTheme 
                                ? 'bg-white/80 border-white/60 text-gray-900 placeholder-gray-600 focus:bg-white/90 focus:ring-2 focus:ring-trefa-600 focus:border-trefa-600 shadow-xl' 
                                : 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-trefa-400 focus:border-transparent'
                            }`}
                          />
                          {errors.email && (
                            <p className={`${isLightTheme ? 'text-red-600' : 'text-red-400'} text-xs mt-2 ml-2`}>{errors.email.message}</p>
                          )}
                        </div>

                        <div>
                          <input
                            {...register('phone')}
                            placeholder="Teléfono (10 dígitos)"
                            className={`w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 backdrop-blur-md border rounded-lg sm:rounded-xl transition-all text-sm sm:text-base shadow-lg ${
                              isLightTheme 
                                ? 'bg-white/80 border-white/60 text-gray-900 placeholder-gray-600 focus:bg-white/90 focus:ring-2 focus:ring-trefa-600 focus:border-trefa-600 shadow-xl' 
                                : 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/20 focus:ring-2 focus:ring-trefa-400 focus:border-transparent'
                            }`}
                          />
                          {errors.phone && (
                            <p className={`${isLightTheme ? 'text-red-600' : 'text-red-400'} text-xs mt-2 ml-2`}>{errors.phone.message}</p>
                          )}
                        </div>

                        <div>
                          <select
                            {...register('monthlyIncome')}
                            className={`w-full px-3 sm:px-4 lg:px-5 py-2.5 sm:py-3 lg:py-4 backdrop-blur-md border rounded-lg sm:rounded-xl transition-all text-sm sm:text-base shadow-lg ${
                              isLightTheme 
                                ? 'bg-white/80 border-white/60 text-gray-900 focus:bg-white/90 focus:ring-2 focus:ring-trefa-600 focus:border-trefa-600 shadow-xl' 
                                : 'bg-white/10 border-white/20 text-white focus:bg-white/20 focus:ring-2 focus:ring-trefa-400 focus:border-transparent'
                            }`}
                          >
                            <option value="" className="text-gray-900">Selecciona tu ingreso mensual</option>
                            <option value="15000" className="text-gray-900">$15,000 - $25,000</option>
                            <option value="30000" className="text-gray-900">$25,000 - $40,000</option>
                            <option value="50000" className="text-gray-900">$40,000 - $60,000</option>
                            <option value="75000" className="text-gray-900">$60,000 - $100,000</option>
                            <option value="100000" className="text-gray-900">$100,000+</option>
                          </select>
                          {errors.monthlyIncome && (
                            <p className={`${isLightTheme ? 'text-red-600' : 'text-red-400'} text-xs mt-2 ml-2`}>{errors.monthlyIncome.message}</p>
                          )}
                        </div>

                        {/* Terms and Age Checkbox */}
                        <div className="space-y-5 sm:space-y-6">
                          <div className="flex items-start space-x-4">
                            <input
                              {...register('isOver21')}
                              type="checkbox"
                              id="isOver21"
                              required
                              className={`mt-1.5 w-6 h-6 sm:w-7 sm:h-7 text-trefa-600 rounded-md focus:ring-trefa-500 focus:ring-2 shadow-lg ${
                                isLightTheme 
                                  ? 'bg-white/90 border-2 border-trefa-300 shadow-xl' 
                                  : 'bg-white/20 border-2 border-white/50'
                              }`}
                            />
                            <label htmlFor="isOver21" className={`text-sm sm:text-base ${isLightTheme ? 'text-gray-900 font-bold' : 'text-white/90'} leading-relaxed font-semibold`}>
                              Soy mayor de 21 años <span className="text-red-400">*</span>
                            </label>
                          </div>
                          {errors.isOver21 && (
                            <p className={`${isLightTheme ? 'text-red-600' : 'text-red-400'} text-xs ml-10`}>{errors.isOver21.message}</p>
                          )}

                          <div className="flex items-start space-x-4">
                            <input
                              {...register('acceptTerms')}
                              type="checkbox"
                              id="acceptTerms"
                              required
                              className={`mt-1.5 w-6 h-6 sm:w-7 sm:h-7 text-trefa-600 rounded-md focus:ring-trefa-500 focus:ring-2 shadow-lg ${
                                isLightTheme 
                                  ? 'bg-white/90 border-2 border-trefa-300 shadow-xl' 
                                  : 'bg-white/20 border-2 border-white/50'
                              }`}
                            />
                            <label htmlFor="acceptTerms" className={`text-sm sm:text-base ${isLightTheme ? 'text-gray-900 font-bold' : 'text-white/90'} leading-relaxed font-semibold`}>
                              Acepto los{' '}
                              <a 
                                href="https://trefa.mx/terminos-y-condiciones/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`${isLightTheme ? 'text-trefa-700 hover:text-trefa-800 font-bold' : 'text-trefa-300 hover:text-trefa-200'} underline`}
                              >
                                términos y condiciones
                              </a>
                              {' '}y{' '}
                              <a 
                                href="https://trefa.mx/politica-de-privacidad/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`${isLightTheme ? 'text-trefa-700 hover:text-trefa-800 font-bold' : 'text-trefa-300 hover:text-trefa-200'} underline`}
                              >
                                política de privacidad
                              </a>
                              <span className="text-red-400"> *</span>
                            </label>
                          </div>
                          {errors.acceptTerms && (
                            <p className={`${isLightTheme ? 'text-red-600' : 'text-red-400'} text-xs ml-10`}>{errors.acceptTerms.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Error Message */}
                      {submissionStatus === 'error' && (
                        <div className={`p-4 backdrop-blur-md border rounded-lg text-center ${
                          isLightTheme 
                            ? 'bg-red-100/80 border-red-400/60 shadow-lg' 
                            : 'bg-red-500/20 border-red-400/30'
                        }`}>
                          <p className={`${isLightTheme ? 'text-red-800 font-bold' : 'text-red-300'} text-sm font-medium mb-2`}>
                            Error al enviar la información
                          </p>
                          <button
                            onClick={() => setSubmissionStatus('idle')}
                            className={`text-xs ${isLightTheme ? 'text-red-700 hover:text-red-900 font-bold' : 'text-red-200 hover:text-white'} transition-colors underline`}
                          >
                            Intentar de nuevo
                          </button>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submissionStatus === 'submitting'}
                        className={`w-full relative group overflow-hidden bg-gradient-to-r ${isLightTheme ? 'from-trefa-600 via-orange-600 to-yellow-600 shadow-2xl' : 'from-trefa-500 via-orange-500 to-yellow-500'} text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg`}
                      >
                        {/* Button Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        
                        <div className="relative flex items-center justify-center space-x-2">
                          {submissionStatus === 'submitting' ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              <span>Enviando...</span>
                            </>
                          ) : (
                            <>
                              <span>Crear mi cuenta</span>
                              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </div>
                      </button>

                      {/* Trust Indicators */}
                      <div className="text-center pt-3 sm:pt-4">
                        <div className={`flex items-center justify-center space-x-2 ${isLightTheme ? 'text-gray-600' : 'text-white/70'} text-sm sm:text-base`}>
                          <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isLightTheme ? 'text-trefa-700' : 'text-trefa-400'} flex-shrink-0`} />
                          <span>Obtén una respuesta tan pronto como en 1 hora</span>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brands Section */}
      <div className={`relative py-12 sm:py-16 lg:py-20 border-t ${isLightTheme ? 'border-trefa-200/60 bg-gradient-to-r from-trefa-50/80 to-orange-50/80' : 'border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-4`}>
              Tus marcas favoritas están aquí
            </h3>
            <p className={`${isLightTheme ? 'text-trefa-700 font-medium' : 'text-white/70'} text-sm sm:text-base lg:text-lg max-w-2xl mx-auto`}>
              Trabajamos con las marcas más confiables del mercado automotriz
            </p>
          </div>

          {/* Brand Logos */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 items-center justify-items-center">
            {['Nissan', 'Toyota', 'Honda', 'Volkswagen', 'Chevrolet'].map((brand, index) => (
              <div key={brand} className="relative group">
                <div className={`absolute -inset-2 bg-gradient-to-r ${isLightTheme ? 'from-trefa-500/50 to-orange-500/50' : 'from-trefa-500/20 to-orange-500/20'} rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100`}></div>
                <div className={`relative backdrop-blur-md ${isLightTheme ? 'bg-white/80 border-white/60 shadow-xl' : 'bg-white/10 border-white/20'} rounded-xl p-4 sm:p-6 border shadow-lg group-hover:shadow-2xl transition-all duration-300`}>
                  <div className={`${isLightTheme ? 'text-trefa-800 font-black' : 'text-white'} font-bold text-lg sm:text-xl lg:text-2xl text-center`}>
                    {brand}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={`relative py-12 sm:py-16 lg:py-20 border-t ${isLightTheme ? 'border-gray-200' : 'border-white/10'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-4`}>
              Lo que dicen nuestros clientes
            </h3>
            <p className={`${isLightTheme ? 'text-gray-700 font-medium' : 'text-white/70'} text-sm sm:text-base lg:text-lg max-w-2xl mx-auto`}>
              Miles de personas ya obtuvieron su financiamiento y hoy manejan un auto TREFA
            </p>
          </div>

          {/* Testimonial Cards with Consistent Brand Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Testimonial 1 */}
            <div className="relative group animate-float" style={{ animationDelay: '0s' }}>
              <div className={`absolute -inset-1 bg-gradient-to-r ${isLightTheme ? 'from-trefa-500/60 to-orange-500/60' : 'from-trefa-500/30 to-orange-500/30'} rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300`}></div>
              <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/80 border-white/60 shadow-2xl' : 'bg-white/10 border-white/20'} rounded-2xl p-6 border shadow-2xl`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full overflow-hidden mr-4 border-2 ${isLightTheme ? 'border-gray-300 shadow-md' : 'border-white/30'}`}>
                    <img 
                      src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400" 
                      alt="María González" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className={`${isLightTheme ? 'text-gray-800' : 'text-white'} font-semibold`}>María González</h4>
                    <p className={`${isLightTheme ? 'text-gray-600' : 'text-white/60'} text-sm`}>Guadalupe, NL</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className={`${isLightTheme ? 'text-gray-700' : 'text-white/80'} text-sm leading-relaxed`}>
                  "En 2 días tenía 3 opciones de financiamiento. BBVA me aprobó con la mejor tasa. ¡Increíble!"
                </p>
                <div className={`mt-4 text-xs ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>
                  Honda Civic 2021 • $320,000
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="relative group animate-float" style={{ animationDelay: '1s' }}>
              <div className={`absolute -inset-1 bg-gradient-to-r ${isLightTheme ? 'from-trefa-500/60 to-orange-500/60' : 'from-trefa-500/30 to-orange-500/30'} rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300`}></div>
              <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/80 border-white/60 shadow-2xl' : 'bg-white/10 border-white/20'} rounded-2xl p-6 border shadow-2xl`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full overflow-hidden mr-4 border-2 ${isLightTheme ? 'border-gray-300 shadow-md' : 'border-white/30'}`}>
                    <img 
                      src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400" 
                      alt="Carlos Mendoza" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className={`${isLightTheme ? 'text-gray-800' : 'text-white'} font-semibold`}>Carlos Mendoza</h4>
                    <p className={`${isLightTheme ? 'text-gray-600' : 'text-white/60'} text-sm`}>Monterrey, NL</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className={`${isLightTheme ? 'text-gray-700' : 'text-white/80'} text-sm leading-relaxed`}>
                  "El proceso fue súper fácil. Me ahorraron semanas de ir banco por banco. Totalmente recomendado."
                </p>
                <div className={`mt-4 text-xs ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>
                  Nissan Sentra 2020 • $280,000
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="relative group animate-float" style={{ animationDelay: '2s' }}>
              <div className={`absolute -inset-1 bg-gradient-to-r ${isLightTheme ? 'from-trefa-500/60 to-orange-500/60' : 'from-trefa-500/30 to-orange-500/30'} rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300`}></div>
              <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/80 border-white/60 shadow-2xl' : 'bg-white/10 border-white/20'} rounded-2xl p-6 border shadow-2xl`}>
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 rounded-full overflow-hidden mr-4 border-2 ${isLightTheme ? 'border-gray-300 shadow-md' : 'border-white/30'}`}>
                    <img 
                      src="https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400" 
                      alt="Ana Rodríguez" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className={`${isLightTheme ? 'text-gray-800' : 'text-white'} font-semibold`}>Ana Rodríguez</h4>
                    <p className={`${isLightTheme ? 'text-gray-600' : 'text-white/60'} text-sm`}>Saltillo, COAH</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className={`${isLightTheme ? 'text-gray-700' : 'text-white/80'} text-sm leading-relaxed`}>
                  "Conseguí mi Toyota con una tasa increíble. El equipo de TREFA me ayudó en todo el proceso."
                </p>
                <div className={`mt-4 text-xs ${isLightTheme ? 'text-gray-500' : 'text-white/50'}`}>
                  Toyota Corolla 2019 • $310,000
                </div>
              </div>
            </div>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
            <div className={`backdrop-blur-md ${isLightTheme ? 'bg-white/70 border-gray-200/50' : 'bg-white/5 border-white/10'} rounded-xl p-4 sm:p-6 border`}>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2`}>2,000+</div>
              <div className={`${isLightTheme ? 'text-gray-600' : 'text-white/60'} text-sm sm:text-base`}>Clientes Satisfechos</div>
            </div>
            <div className={`backdrop-blur-md ${isLightTheme ? 'bg-white/70 border-gray-200/50' : 'bg-white/5 border-white/10'} rounded-xl p-4 sm:p-6 border`}>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2`}>6.5h</div>
              <div className={`${isLightTheme ? 'text-gray-600' : 'text-white/60'} text-sm sm:text-base`}>Tiempo Promedio</div>
            </div>
            <div className={`backdrop-blur-md ${isLightTheme ? 'bg-white/70 border-gray-200/50' : 'bg-white/5 border-white/10'} rounded-xl p-4 sm:p-6 border`}>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2`}>75%</div>
              <div className={`${isLightTheme ? 'text-gray-600' : 'text-white/60'} text-sm sm:text-base`}>Tasa de Aprobación</div>
            </div>
            <div className={`backdrop-blur-md ${isLightTheme ? 'bg-white/70 border-gray-200/50' : 'bg-white/5 border-white/10'} rounded-xl p-4 sm:p-6 border`}>
              <div className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2`}>7</div>
              <div className={`${isLightTheme ? 'text-gray-600' : 'text-white/60'} text-sm sm:text-base`}>Bancos Asociados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantees Section - "LLÉVATE TRANQUILIDAD" */}
      <div className={`relative py-16 sm:py-20 lg:py-24 ${isLightTheme ? 'bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/20' : 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <h3 className={`text-lg sm:text-xl font-bold mb-4 ${isLightTheme ? 'text-orange-600' : 'text-orange-400'} tracking-wider uppercase`}>
                  LLÉVATE TRANQUILIDAD.
                </h3>
                <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} leading-tight mb-8`}>
                  Garantías de defensa a defensa a donde vayas.
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-6 h-6 rounded-full ${isLightTheme ? 'bg-orange-500' : 'bg-orange-400'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Si tu auto falla en los primeros 30 días, elige otro de valor igual o inferior, o recibe el <span className="font-bold">100% de reembolso</span>
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`w-6 h-6 rounded-full ${isLightTheme ? 'bg-orange-500' : 'bg-orange-400'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Autos inspeccionados, verificados por REPUVE y con <span className="font-bold">garantías por escrito</span>
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`w-6 h-6 rounded-full ${isLightTheme ? 'bg-orange-500' : 'bg-orange-400'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Ante cualquier falla mecánica recibe un descuento <span className="font-bold">en el pago de tu mensualidad</span> por cada día que tu auto esté en el taller
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`w-6 h-6 rounded-full ${isLightTheme ? 'bg-orange-500' : 'bg-orange-400'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Cubrimos tus traslados de Uber y Didi (hasta por $250 por día) por cada día que tu auto esté en reparación.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`inline-flex items-center px-8 py-4 ${isLightTheme ? 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black' : 'bg-gradient-to-r from-corporate-700 to-corporate-800 hover:from-corporate-800 hover:to-corporate-900'} text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
                >
                  REGISTRARME
                  <ArrowRight className="w-6 h-6 ml-3" />
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              <div className={`absolute -inset-4 bg-gradient-to-r ${isLightTheme ? 'from-orange-400/40 to-yellow-400/40' : 'from-orange-500/30 to-yellow-500/30'} rounded-3xl blur-2xl animate-pulse`}></div>
              <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/60 border-orange-200/50' : 'bg-white/10 border-white/20'} rounded-3xl p-8 border shadow-2xl`}>
                <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl overflow-hidden">
                  {/* Car with shield and icons */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Car silhouette */}
                      <div className="w-80 h-40 bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        {/* Car details */}
                        <div className="absolute bottom-4 left-6 right-6 flex justify-between">
                          <div className="w-8 h-8 bg-gray-900 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-900 rounded-full"></div>
                        </div>
                      </div>
                      
                      {/* Shield overlay */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-20 h-24 bg-gradient-to-b from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-2xl">
                          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Floating icons */}
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-bounce">
                        <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                        <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Commitment Section */}
      <div className={`relative py-16 sm:py-20 lg:py-24 ${isLightTheme ? 'bg-gradient-to-br from-blue-50 via-white to-orange-50/30' : 'bg-gradient-to-br from-black via-gray-900 to-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Video */}
            <div className="relative">
              <div className={`absolute -inset-4 bg-gradient-to-r ${isLightTheme ? 'from-blue-400/40 to-purple-400/40' : 'from-blue-500/30 to-purple-500/30'} rounded-3xl blur-2xl animate-pulse`}></div>
              <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/70 border-blue-200/50' : 'bg-white/10 border-white/20'} rounded-3xl p-6 border shadow-2xl`}>
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden relative">
                  {/* Video placeholder with team image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-6">
                    <div className="text-center">
                      <h4 className="text-white font-bold text-2xl mb-2">UNA</h4>
                      <p className="text-white/80 text-sm">EMPRESA SÓLIDA</p>
                    </div>
                  </div>
                  
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  
                  {/* Video controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-3">
                    <Play className="w-4 h-4 text-white" />
                    <div className="flex-1 bg-white/20 rounded-full h-1">
                      <div className="bg-white w-1/4 h-1 rounded-full"></div>
                    </div>
                    <span className="text-white text-xs">0:00 / 1:02</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-8">
              <div>
                <h3 className={`text-lg sm:text-xl font-bold mb-4 ${isLightTheme ? 'text-orange-600' : 'text-orange-400'} tracking-wider uppercase`}>
                  NUESTRO COMPROMISO
                </h3>
                <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} leading-tight mb-8`}>
                  Te garantizamos el respaldo financiero que mereces
                </h2>
              </div>

              <p className={`text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/80'} leading-relaxed mb-8`}>
                Elimina los riesgos de comprar tu auto a un particular o un lote convencional con nuestros programas de financiamiento digital respaldados por los bancos que tú ya conoces:
              </p>

              {/* Bank logos */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className={`${isLightTheme ? 'bg-white/80 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-4 border shadow-lg flex items-center justify-center`}>
                  <span className="text-blue-600 font-bold text-lg">BBVA</span>
                </div>
                <div className={`${isLightTheme ? 'bg-white/80 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-4 border shadow-lg flex items-center justify-center`}>
                  <span className="text-red-600 font-bold text-lg">Scotiabank</span>
                </div>
                <div className={`${isLightTheme ? 'bg-white/80 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-4 border shadow-lg flex items-center justify-center`}>
                  <span className="text-green-600 font-bold text-lg">AFIRME</span>
                </div>
                <div className={`${isLightTheme ? 'bg-white/80 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-4 border shadow-lg flex items-center justify-center`}>
                  <span className="text-orange-600 font-bold text-lg">BANORTE</span>
                </div>
                <div className={`${isLightTheme ? 'bg-white/80 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-4 border shadow-lg flex items-center justify-center`}>
                  <span className="text-orange-500 font-bold text-lg">banregio</span>
                </div>
                <div className={`${isLightTheme ? 'bg-white/80 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-4 border shadow-lg flex items-center justify-center`}>
                  <span className="text-purple-600 font-bold text-lg">Hey Banco</span>
                </div>
              </div>

              <button
                onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
                className={`inline-flex items-center px-8 py-4 ${isLightTheme ? 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black' : 'bg-gradient-to-r from-corporate-700 to-corporate-800 hover:from-corporate-800 hover:to-corporate-900'} text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
              >
                REGISTRARME
                <ArrowRight className="w-6 h-6 ml-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Financing Section */}
      <div className={`relative py-16 sm:py-20 lg:py-24 ${isLightTheme ? 'bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20' : 'bg-gradient-to-br from-gray-800 via-black to-gray-900'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-8`}>
              ¿Porqué elegir nuestro financiamiento digital?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full ${isLightTheme ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Llena tu solicitud desde tu celular en pocos minutos y recibe una respuesta en 24 horas o menos.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full ${isLightTheme ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Financia tu auto con BBVA, Banregio, BANORTE, AFIRME, Scotiabank, y Hey Banco, nuestros bancos asociados.
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full ${isLightTheme ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Perfilamiento bancario inteligente: enviamos tu solicitud al banco con la mayor probabilidad de aprobación
                  </p>
                </div>

                <div className="flex items-start space-x-4">
                  <div className={`w-8 h-8 rounded-full ${isLightTheme ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className={`text-base sm:text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/90'} leading-relaxed`}>
                    Sin anticipos ni cobros sorpresa: paga tu enganche solo al finalizar tu trámite de financiamiento.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Shield Graphic */}
            <div className="relative">
              <div className={`absolute -inset-4 bg-gradient-to-r ${isLightTheme ? 'from-orange-400/40 to-red-400/40' : 'from-orange-500/30 to-red-500/30'} rounded-3xl blur-2xl animate-pulse`}></div>
              <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/70 border-orange-200/50' : 'bg-white/10 border-white/20'} rounded-3xl p-8 border shadow-2xl`}>
                <div className="text-center">
                  {/* Large TREFA text */}
                  <div className={`text-6xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-8 tracking-wider`}>
                    TREFA
                  </div>
                  
                  {/* Shield with bank logos */}
                  <div className="relative">
                    <div className="w-80 h-60 bg-gradient-to-b from-orange-400 to-orange-600 rounded-3xl relative overflow-hidden shadow-2xl mx-auto">
                      {/* 3D Shield effect */}
                      <div className="absolute inset-4 bg-gradient-to-b from-orange-300 to-orange-500 rounded-2xl shadow-inner">
                        <div className="absolute inset-2 bg-white/10 rounded-xl flex items-center justify-center">
                          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating bank logos around shield */}
                    <div className="absolute -top-4 left-1/4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-float">
                      <span className="text-blue-600 font-bold text-sm">BBVA</span>
                    </div>
                    <div className="absolute top-1/4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                      <span className="text-red-600 font-bold text-xs">Scotia</span>
                    </div>
                    <div className="absolute -bottom-4 right-1/4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
                      <span className="text-orange-600 font-bold text-xs">BANORTE</span>
                    </div>
                    <div className="absolute bottom-1/4 -left-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                      <span className="text-green-600 font-bold text-xs">AFIRME</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Profiling Section */}
      <div className={`relative py-16 sm:py-20 lg:py-24 ${isLightTheme ? 'bg-gradient-to-br from-orange-50/30 via-white to-blue-50/30' : 'bg-gradient-to-br from-gray-900 via-black to-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Image */}
            <div className="relative">
              <div className={`absolute -inset-4 bg-gradient-to-r ${isLightTheme ? 'from-orange-400/40 to-yellow-400/40' : 'from-orange-500/30 to-yellow-500/30'} rounded-3xl blur-2xl animate-pulse`}></div>
              <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/70 border-orange-200/50' : 'bg-white/10 border-white/20'} rounded-3xl p-8 border shadow-2xl`}>
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl overflow-hidden relative">
                  {/* Person with phone */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-40 bg-gradient-to-b from-gray-700 to-gray-800 rounded-2xl relative mx-auto mb-4 shadow-xl">
                        {/* Person silhouette */}
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-orange-300 rounded-full"></div>
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-12 h-16 bg-blue-600 rounded-lg"></div>
                        
                        {/* Phone in hand */}
                        <div className="absolute bottom-8 right-4 w-6 h-10 bg-gray-900 rounded-lg border border-gray-600">
                          <div className="w-full h-6 bg-blue-400 rounded-t-lg"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-8">
              <div>
                <h3 className={`text-lg sm:text-xl font-bold mb-4 ${isLightTheme ? 'text-orange-600' : 'text-orange-400'} tracking-wider uppercase`}>
                  PERFILAMIENTO INTELIGENTE
                </h3>
                <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} leading-tight mb-8`}>
                  Elegimos el banco con más probabilidades de aprobar tu solicitud
                </h2>
              </div>

              <p className={`text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/80'} leading-relaxed mb-8`}>
                Para brindarte el mejor servicio, hemos desarrollado un sistema de perfilamiento bancario inteligente que, con base en tus respuestas, identifica cuál de nuestros bancos asociados tiene mayores probabilidades de aprobar tu solicitud.
              </p>

              <button
                onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
                className={`inline-flex items-center px-8 py-4 ${isLightTheme ? 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black' : 'bg-gradient-to-r from-corporate-700 to-corporate-800 hover:from-corporate-800 hover:to-corporate-900'} text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
              >
                ELEGIR MI AUTO TREFA
                <ArrowRight className="w-6 h-6 ml-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banregio Partnership Section */}
      <div className={`relative py-16 sm:py-20 lg:py-24 ${isLightTheme ? 'bg-gradient-to-br from-blue-50 via-white to-orange-50' : 'bg-gradient-to-br from-black via-gray-900 to-gray-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className={`text-4xl sm:text-5xl lg:text-6xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-4 tracking-wider`}>
              TREFA
            </div>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} leading-tight mb-8`}>
              Estrena un auto seminuevo con nuestro financiamiento digital respaldado por
            </h2>
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent mb-8">
              BANREGIO
            </div>
            <p className={`text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/80'} max-w-3xl mx-auto leading-relaxed`}>
              Regístrate en nuestro portal de financiamiento y obtén respuesta en menos de 24 horas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
              className={`inline-flex items-center px-8 py-4 ${isLightTheme ? 'bg-white border-2 border-gray-300 text-gray-800 hover:border-gray-400 hover:bg-gray-50' : 'bg-white/10 border-2 border-white/30 text-white hover:bg-white/20'} rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-md`}
            >
              Ver beneficios
            </button>
            <Link
              href="/autos"
              className={`inline-flex items-center px-8 py-4 ${isLightTheme ? 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black' : 'bg-gradient-to-r from-corporate-700 to-corporate-800 hover:from-corporate-800 hover:to-corporate-900'} text-white rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
            >
              Ver autos disponibles
            </Link>
          </div>

          {/* Car with Road Graphic */}
          <div className="relative">
            <div className={`absolute -inset-8 bg-gradient-to-r ${isLightTheme ? 'from-orange-400/30 to-purple-400/30' : 'from-orange-500/20 to-purple-500/20'} rounded-full blur-3xl animate-pulse`}></div>
            <div className="relative">
              {/* Road/Path */}
              <div className="w-full h-40 relative overflow-hidden">
                <svg viewBox="0 0 800 200" className="w-full h-full">
                  <defs>
                    <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#ea580c" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,150 Q200,100 400,120 T800,100"
                    stroke="url(#roadGradient)"
                    strokeWidth="60"
                    fill="none"
                    opacity="0.8"
                  />
                  {/* Dashed lines */}
                  <path
                    d="M0,150 Q200,100 400,120 T800,100"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="20,15"
                    fill="none"
                    opacity="0.9"
                  />
                </svg>
                
                {/* Car on road */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-32 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg relative shadow-2xl">
                    {/* Car details */}
                    <div className="absolute top-2 left-4 right-4 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded opacity-80"></div>
                    <div className="absolute bottom-1 left-2 w-4 h-4 bg-gray-900 rounded-full"></div>
                    <div className="absolute bottom-1 right-2 w-4 h-4 bg-gray-900 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Success badge */}
              <div className="absolute bottom-0 right-1/4 transform translate-y-1/2">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form Section */}
      <div id="registration-form" className={`relative py-16 sm:py-20 lg:py-24 ${isLightTheme ? 'bg-gradient-to-br from-white via-gray-50 to-blue-50' : 'bg-gradient-to-br from-gray-800 via-gray-900 to-black'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-6`}>
              ¡Comienza tu proceso ahora!
            </h2>
            <p className={`text-lg ${isLightTheme ? 'text-gray-700' : 'text-white/80'} max-w-2xl mx-auto leading-relaxed`}>
              Completa tu registro y obtén una respuesta personalizada en menos de 24 horas
            </p>
          </div>

          {/* Iframe Container */}
          <div className="relative">
            <div className={`absolute -inset-4 bg-gradient-to-r ${isLightTheme ? 'from-blue-400/30 to-orange-400/30' : 'from-blue-500/20 to-orange-500/20'} rounded-3xl blur-2xl animate-pulse`}></div>
            <div className={`relative backdrop-blur-xl ${isLightTheme ? 'bg-white/90 border-gray-200/50 shadow-2xl' : 'bg-white/5 border-white/10'} rounded-3xl p-2 border shadow-2xl`}>
              <iframe
                src="https://portal.trefa.mx/registrarme"
                className="w-full h-[600px] rounded-2xl"
                title="Formulario de Registro TREFA"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>

          {/* Trust Indicators Below Form */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className={`${isLightTheme ? 'bg-white/70 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-6 border shadow-lg backdrop-blur-md`}>
              <Shield className={`w-12 h-12 ${isLightTheme ? 'text-green-600' : 'text-green-400'} mx-auto mb-3`} />
              <h4 className={`font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2`}>100% Seguro</h4>
              <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-white/70'}`}>Proceso completamente seguro y confidencial</p>
            </div>
            
            <div className={`${isLightTheme ? 'bg-white/70 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-6 border shadow-lg backdrop-blur-md`}>
              <Clock className={`w-12 h-12 ${isLightTheme ? 'text-blue-600' : 'text-blue-400'} mx-auto mb-3`} />
              <h4 className={`font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2`}>Respuesta Rápida</h4>
              <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-white/70'}`}>Obtén respuesta en menos de 24 horas</p>
            </div>
            
            <div className={`${isLightTheme ? 'bg-white/70 border-gray-200' : 'bg-white/10 border-white/20'} rounded-xl p-6 border shadow-lg backdrop-blur-md`}>
              <Users className={`w-12 h-12 ${isLightTheme ? 'text-purple-600' : 'text-purple-400'} mx-auto mb-3`} />
              <h4 className={`font-bold ${isLightTheme ? 'text-gray-900' : 'text-white'} mb-2`}>Sin Compromisos</h4>
              <p className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-white/70'}`}>Proceso gratuito sin obligación de compra</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Proper Spacing */}
      <footer className={`relative py-8 sm:py-12 border-t ${isLightTheme ? 'border-gray-200/50 bg-white/50 backdrop-blur-xl' : 'border-white/10'} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center ${isLightTheme ? 'text-gray-700' : 'text-white/60'} text-xs sm:text-sm font-medium`}>
            <div className="mb-4">
              <a href="https://trefa.mx/terminos-y-condiciones/" target="_blank" rel="noopener noreferrer" className={`transition-colors ${isLightTheme ? 'text-trefa-600 hover:text-trefa-800' : 'hover:text-white'}`}>
                Términos y Condiciones
              </a>
              {' • '}
              <a href="https://trefa.mx/politica-de-privacidad/" target="_blank" rel="noopener noreferrer" className={`transition-colors ${isLightTheme ? 'text-trefa-600 hover:text-trefa-800' : 'hover:text-white'}`}>
                Política de Privacidad
              </a>
              {' • '}
              <Link href="/vender" className={`transition-colors ${isLightTheme ? 'text-trefa-600 hover:text-trefa-800' : 'hover:text-white'}`}>
                Vender mi Auto
              </Link>
              {' • '}
              <a href="https://trefa.mx/" target="_blank" rel="noopener noreferrer" className={`transition-colors ${isLightTheme ? 'text-trefa-600 hover:text-trefa-800' : 'hover:text-white'}`}>
                TREFA.mx
              </a>
            </div>
            <p>© 2025 TREFA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
