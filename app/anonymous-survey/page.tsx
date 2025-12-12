'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import QRCode from 'qrcode';
import { supabase } from '../../supabaseClient';
import { toast } from 'sonner';
import { Gift, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

// Type definitions for survey questions
interface BaseQuestion {
  id: string;
  question: string;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice' | 'likert-4';
  options: Array<{ value: string; label: string }>;
}

interface RatingHorizontalQuestion extends BaseQuestion {
  type: 'rating-horizontal';
  min: number;
  max: number;
  labels: { min: string; max: string };
}

interface TextQuestion extends BaseQuestion {
  type: 'text';
  placeholder?: string;
}

type SurveyQuestion = MultipleChoiceQuestion | RatingHorizontalQuestion | TextQuestion;

// Comprehensive survey questions (48 total: 41 original - 8 removed + 15 added)
const surveyQuestions: SurveyQuestion[] = [
  // Demographics (5 questions)
  {
    id: 'age',
    question: '¿Cuál es tu rango de edad?',
    type: 'multiple-choice',
    options: [
      { value: '18-24', label: '18-24 años' },
      { value: '25-34', label: '25-34 años' },
      { value: '35-44', label: '35-44 años' },
      { value: '45-54', label: '45-54 años' },
      { value: '55+', label: '55+ años' }
    ]
  },
  {
    id: 'gender',
    question: '¿Cómo te identificas?',
    type: 'multiple-choice',
    options: [
      { value: 'masculino', label: 'Masculino' },
      { value: 'femenino', label: 'Femenino' },
      { value: 'otro', label: 'Otro' },
      { value: 'prefiero-no-decir', label: 'Prefiero no decir' }
    ]
  },
  {
    id: 'municipality',
    question: '¿En qué municipio vives?',
    type: 'multiple-choice',
    options: [
      { value: 'monterrey', label: 'Monterrey' },
      { value: 'san-nicolas', label: 'San Nicolás' },
      { value: 'san-pedro', label: 'San Pedro' },
      { value: 'santa-catarina', label: 'Santa Catarina' },
      { value: 'juarez', label: 'Juárez' },
      { value: 'guadalupe', label: 'Guadalupe' },
      { value: 'garcia', label: 'García' },
      { value: 'escobedo', label: 'Escobedo' },
      { value: 'apodaca', label: 'Apodaca' },
      { value: 'reynosa', label: 'Reynosa' },
      { value: 'saltillo', label: 'Saltillo' },
      { value: 'torreon', label: 'Torreón' },
      { value: 'matamoros', label: 'Matamoros' },
      { value: 'otro', label: 'Otro' }
    ]
  },
  {
    id: 'income',
    question: '¿Cuál es tu rango de ingreso mensual?',
    type: 'multiple-choice',
    options: [
      { value: 'menos-15k', label: 'Menos de $15,000' },
      { value: '15k-30k', label: '$15,000 - $30,000' },
      { value: '30k-50k', label: '$30,000 - $50,000' },
      { value: '50k-80k', label: '$50,000 - $80,000' },
      { value: '80k-120k', label: '$80,000 - $120,000' },
      { value: 'mas-120k', label: 'Más de $120,000' }
    ]
  },
  {
    id: 'employment-status',
    question: '¿Cuál es tu situación laboral actual?',
    type: 'multiple-choice',
    options: [
      { value: 'empleado', label: 'Empleado' },
      { value: 'autonomo', label: 'Autónomo/Emprendedor' },
      { value: 'profesionista', label: 'Profesionista independiente' },
      { value: 'estudiante', label: 'Estudiante' }
    ]
  },

  // TREFA Application Process (5 questions)
  {
    id: 'completed-banking-profile',
    question: 'Finalicé mi perfilamiento bancario',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Verdadero' },
      { value: '0', label: 'Falso' }
    ]
  },
  {
    id: 'started-credit-application',
    question: 'Inicié mi solicitud de crédito',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Verdadero' },
      { value: '0', label: 'Falso' }
    ]
  },
  {
    id: 'submitted-complete-application',
    question: 'Envié mi solicitud de financiamiento completa',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Verdadero' },
      { value: '0', label: 'Falso' }
    ]
  },
  {
    id: 'information-reasonable',
    question: 'La información solicitada me parece razonable',
    type: 'likert-4',
    options: [
      { value: '2', label: 'Sí' },
      { value: '0', label: 'No' },
      { value: '1', label: 'No lo sé' }
    ]
  },
  {
    id: 'trust-data-sharing',
    question: 'Siento confianza al compartir mis datos personales con TREFA',
    type: 'likert-4',
    options: [
      { value: '2', label: 'Sí' },
      { value: '0', label: 'No' },
      { value: '1', label: 'No lo sé' }
    ]
  },

  // Discovery & Source (3 questions)
  {
    id: 'source',
    question: '¿Cómo nos conociste?',
    type: 'multiple-choice',
    options: [
      { value: 'google', label: 'Google/Búsqueda en internet' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'tiktok', label: 'TikTok' },
      { value: 'youtube', label: 'YouTube' },
      { value: 'recomendacion', label: 'Recomendación de conocido' },
      { value: 'publicidad', label: 'Publicidad (anuncios)' },
      { value: 'otro', label: 'Otro' }
    ]
  },
  {
    id: 'first-impression',
    question: '¿Cuál fue tu primera impresión de TREFA?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Poco profesional' },
      { value: '2', label: 'Aceptable' },
      { value: '3', label: 'Profesional' },
      { value: '4', label: 'Muy profesional' }
    ]
  },
  {
    id: 'social-media-content',
    question: '¿El contenido que compartimos en redes sociales y blog te parece relevante para tu proceso de compra?',
    type: 'likert-4',
    options: [
      { value: '4', label: 'Sí, es útil e informativo' },
      { value: '3', label: 'A veces, algunas cosas sí, otras no' },
      { value: '2', label: 'No realmente, no me ayuda mucho' },
      { value: '1', label: 'No he visto su contenido' }
    ]
  },
  {
    id: 'ad-recall',
    question: '¿Has visto nuestros anuncios en Facebook/Instagram/Google?',
    type: 'multiple-choice',
    options: [
      { value: 'facebook', label: 'Sí, en Facebook' },
      { value: 'instagram', label: 'Sí, en Instagram' },
      { value: 'google', label: 'Sí, en Google' },
      { value: 'multiple', label: 'Sí, en varias plataformas' },
      { value: 'no', label: 'No he visto anuncios' }
    ]
  },

  // Trust & Brand Perception (5 questions)
  {
    id: 'trust',
    question: '¿Qué fue lo que más te generó confianza en TREFA?',
    type: 'multiple-choice',
    options: [
      { value: 'transparencia-precios', label: 'Transparencia en precios' },
      { value: 'variedad-inventario', label: 'Variedad de inventario' },
      { value: 'plataforma-profesional', label: 'Plataforma profesional' },
      { value: 'opiniones-clientes', label: 'Opiniones de otros clientes' },
      { value: 'facilidad-proceso', label: 'Facilidad del proceso' },
      { value: 'atencion-personalizada', label: 'Atención personalizada' }
    ]
  },
  {
    id: 'brand-differentiation',
    question: '¿Qué hace a TREFA diferente de otras opciones?',
    type: 'multiple-choice',
    options: [
      { value: 'proceso-digital', label: 'Proceso digital y moderno' },
      { value: 'transparencia', label: 'Transparencia total' },
      { value: 'variedad', label: 'Amplia variedad de vehículos' },
      { value: 'financiamiento', label: 'Opciones de financiamiento' },
      { value: 'confianza', label: 'Mayor confianza y seguridad' },
      { value: 'nada', label: 'No veo diferencias significativas' }
    ]
  },
  {
    id: 'trust-level',
    question: '¿Qué tan confiable consideras comprar un auto con TREFA?',
    type: 'rating-horizontal',
    min: 1,
    max: 10,
    labels: {
      min: 'Nada confiable',
      max: 'Muy confiable'
    }
  },
  {
    id: 'trefa-vs-private-seller',
    question: '¿Consideras que TREFA tiene ventajas sobre comprar directo de particular?',
    type: 'multiple-choice',
    options: [
      { value: 'si-garantia', label: 'Sí, por la garantía y seguridad' },
      { value: 'si-transparencia', label: 'Sí, por la transparencia' },
      { value: 'si-financiamiento', label: 'Sí, por las opciones de financiamiento' },
      { value: 'si-multiple', label: 'Sí, por múltiples razones' },
      { value: 'no', label: 'No veo ventajas significativas' }
    ]
  },

  // Platform Experience (4 questions)
  {
    id: 'website-ease',
    question: '¿Qué tan fácil fue navegar nuestra plataforma?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Muy difícil' },
      { value: '2', label: 'Algo complicado' },
      { value: '3', label: 'Fácil' },
      { value: '4', label: 'Muy fácil' }
    ]
  },
  {
    id: 'information-clarity',
    question: '¿La información de los vehículos es clara y completa?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Falta mucha información' },
      { value: '2', label: 'Falta información importante' },
      { value: '3', label: 'Suficiente información' },
      { value: '4', label: 'Información muy completa' }
    ]
  },
  {
    id: 'search-functionality',
    question: '¿Qué tan útiles son los filtros de búsqueda?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Poco útiles' },
      { value: '2', label: 'Algo útiles' },
      { value: '3', label: 'Útiles' },
      { value: '4', label: 'Muy útiles' }
    ]
  },
  {
    id: 'mobile-experience',
    question: '¿Has usado nuestra plataforma desde tu celular?',
    type: 'multiple-choice',
    options: [
      { value: 'si-excelente', label: 'Sí, funciona excelente' },
      { value: 'si-buena', label: 'Sí, funciona bien' },
      { value: 'si-problemas', label: 'Sí, pero con algunos problemas' },
      { value: 'no', label: 'No, solo desde computadora' }
    ]
  },

  // Purchase Journey (6 questions)
  {
    id: 'purchase-stage',
    question: '¿En qué etapa de compra te encuentras?',
    type: 'multiple-choice',
    options: [
      { value: 'solo-viendo', label: 'Solo viendo opciones' },
      { value: 'investigando', label: 'Investigando activamente' },
      { value: 'comparando', label: 'Comparando opciones específicas' },
      { value: 'listo-comprar', label: 'Listo para comprar pronto' }
    ]
  },
  {
    id: 'purchase-timeline',
    question: '¿Cuándo planeas comprar tu próximo auto?',
    type: 'multiple-choice',
    options: [
      { value: 'este-mes', label: 'Este mes' },
      { value: '1-3-meses', label: '1-3 meses' },
      { value: '3-6-meses', label: '3-6 meses' },
      { value: 'mas-6-meses', label: 'Más de 6 meses' }
    ]
  },
  {
    id: 'budget-range',
    question: '¿Cuál es tu presupuesto aproximado?',
    type: 'multiple-choice',
    options: [
      { value: 'menos-150k', label: 'Menos de $150,000' },
      { value: '150k-250k', label: '$150,000 - $250,000' },
      { value: '250k-350k', label: '$250,000 - $350,000' },
      { value: '350k-500k', label: '$350,000 - $500,000' },
      { value: 'mas-500k', label: 'Más de $500,000' }
    ]
  },
  {
    id: 'previous-purchase',
    question: '¿Has comprado un auto seminuevo antes?',
    type: 'multiple-choice',
    options: [
      { value: 'si-agencia', label: 'Sí, en agencia' },
      { value: 'si-particular', label: 'Sí, a particular' },
      { value: 'si-plataforma', label: 'Sí, en plataforma digital' },
      { value: 'no', label: 'No, sería mi primera vez' }
    ]
  },
  {
    id: 'dealer-visit-intention',
    question: '¿Planeas visitar físicamente el auto antes de comprar?',
    type: 'likert-4',
    options: [
      { value: '4', label: 'Sí, es indispensable' },
      { value: '3', label: 'Probablemente sí' },
      { value: '2', label: 'No es necesario' },
      { value: '1', label: 'Prefiero proceso 100% digital' }
    ]
  },
  {
    id: 'competitor-consideration',
    question: '¿Consideras alguna otra agencia o lote?',
    type: 'multiple-choice',
    options: [
      { value: 'no', label: 'No, ninguna' },
      { value: 'agencia-nueva', label: 'Sí, agencias de autos nuevos' },
      { value: 'agencia-seminuevos', label: 'Sí, agencias de seminuevos' },
      { value: 'lote-local', label: 'Sí, lotes locales' },
      { value: 'plataforma-online', label: 'Sí, otras plataformas online' }
    ]
  },
  {
    id: 'brand-interest',
    question: '¿Qué marcas de autos te interesan? (Puedes seleccionar varias)',
    type: 'multiple-choice',
    options: [
      { value: 'toyota', label: 'Toyota' },
      { value: 'nissan', label: 'Nissan' },
      { value: 'honda', label: 'Honda' },
      { value: 'mazda', label: 'Mazda' },
      { value: 'ford', label: 'Ford' },
      { value: 'chevrolet', label: 'Chevrolet' },
      { value: 'volkswagen', label: 'Volkswagen' },
      { value: 'bmw', label: 'BMW' },
      { value: 'mercedes-benz', label: 'Mercedes-Benz' },
      { value: 'audi', label: 'Audi' },
      { value: 'kia', label: 'Kia' },
      { value: 'hyundai', label: 'Hyundai' },
      { value: 'jeep', label: 'Jeep' },
      { value: 'ram', label: 'RAM' },
      { value: 'dodge', label: 'Dodge' },
      { value: 'gmc', label: 'GMC' },
      { value: 'cadillac', label: 'Cadillac' },
      { value: 'volvo', label: 'Volvo' },
      { value: 'subaru', label: 'Subaru' },
      { value: 'mitsubishi', label: 'Mitsubishi' },
      { value: 'suzuki', label: 'Suzuki' },
      { value: 'peugeot', label: 'Peugeot' },
      { value: 'renault', label: 'Renault' },
      { value: 'seat', label: 'SEAT' },
      { value: 'fiat', label: 'Fiat' },
      { value: 'chrysler', label: 'Chrysler' },
      { value: 'buick', label: 'Buick' },
      { value: 'lincoln', label: 'Lincoln' },
      { value: 'mg', label: 'MG' },
      { value: 'otras', label: 'Otras marcas' }
    ]
  },

  // Preferences & Priorities (5 questions)
  {
    id: 'vehicle-priority',
    question: '¿Qué es lo más importante para ti en un auto?',
    type: 'multiple-choice',
    options: [
      { value: 'precio', label: 'Mejor precio posible' },
      { value: 'seguridad', label: 'Seguridad y confiabilidad' },
      { value: 'economia', label: 'Economía de combustible' },
      { value: 'tecnologia', label: 'Tecnología y comodidades' },
      { value: 'espacio', label: 'Espacio y capacidad' },
      { value: 'marca', label: 'Marca y prestigio' }
    ]
  },
  {
    id: 'new-vs-used',
    question: '¿Por qué prefieres autos seminuevos sobre nuevos?',
    type: 'multiple-choice',
    options: [
      { value: 'precio', label: 'Mejor precio' },
      { value: 'depreciacion', label: 'Menos depreciación' },
      { value: 'mas-auto', label: 'Más auto por el dinero' },
      { value: 'no-prefiero', label: 'No necesariamente los prefiero' }
    ]
  },
  {
    id: 'warranty-importance',
    question: '¿Qué tan importante es la garantía para ti?',
    type: 'rating-horizontal',
    min: 1,
    max: 10,
    labels: {
      min: 'Poco importante',
      max: 'Muy importante'
    }
  },
  {
    id: 'payment-preference',
    question: '¿Cómo preferirías pagar tu auto?',
    type: 'multiple-choice',
    options: [
      { value: 'contado', label: 'De contado' },
      { value: 'financiamiento-banco', label: 'Financiamiento bancario' },
      { value: 'financiamiento-trefa', label: 'Financiamiento con TREFA' },
      { value: 'combinacion', label: 'Combinación de opciones' }
    ]
  },

  // Financing & Budget (5 questions)
  {
    id: 'financing-importance',
    question: '¿Qué tan importante es el financiamiento para tu compra?',
    type: 'rating-horizontal',
    min: 1,
    max: 10,
    labels: {
      min: 'Nada importante',
      max: 'Muy importante'
    }
  },
  {
    id: 'bank-vs-leasing',
    question: '¿Prefieres financiamiento a través de banco o arrendadora?',
    type: 'multiple-choice',
    options: [
      { value: 'banco', label: 'Banco' },
      { value: 'arrendadora', label: 'Arrendadora' },
      { value: 'cualquiera', label: 'Cualquiera que me apruebe' },
      { value: 'no-se', label: 'No sé la diferencia' }
    ]
  },
  {
    id: 'approval-speed-importance',
    question: '¿Qué tan importante es la rapidez en el proceso de aprobación?',
    type: 'rating-horizontal',
    min: 1,
    max: 10,
    labels: {
      min: 'Poco importante',
      max: 'Muy importante'
    }
  },
  {
    id: 'down-payment-capacity',
    question: '¿Con cuánto podrías dar de enganche?',
    type: 'multiple-choice',
    options: [
      { value: 'sin-enganche', label: 'Sin enganche / 0%' },
      { value: '10-20', label: '10-20% del precio' },
      { value: '20-30', label: '20-30% del precio' },
      { value: '30-50', label: '30-50% del precio' },
      { value: 'mas-50', label: 'Más del 50%' }
    ]
  },

  // Service & Experience (4 questions)
  {
    id: 'communication-preference',
    question: '¿Qué canal de comunicación prefieres?',
    type: 'multiple-choice',
    options: [
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'email', label: 'Email' },
      { value: 'llamada', label: 'Llamada telefónica' },
      { value: 'app', label: 'App/Plataforma web' },
      { value: 'presencial', label: 'Presencial' }
    ]
  },
  {
    id: 'response-time-satisfaction',
    question: '¿Qué tan satisfecho estás con nuestros tiempos de respuesta?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Muy lento' },
      { value: '2', label: 'Algo lento' },
      { value: '3', label: 'Adecuado' },
      { value: '4', label: 'Muy rápido' }
    ]
  },
  {
    id: 'advisor-satisfaction',
    question: '¿Cómo calificarías la atención de nuestros asesores?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Necesita mejorar' },
      { value: '2', label: 'Aceptable' },
      { value: '3', label: 'Buena' },
      { value: '4', label: 'Excelente' }
    ]
  },
  {
    id: 'additional-services',
    question: '¿Qué servicios adicionales te interesarían?',
    type: 'multiple-choice',
    options: [
      { value: 'seguro', label: 'Seguro de auto' },
      { value: 'mantenimiento', label: 'Paquetes de mantenimiento' },
      { value: 'accesorios', label: 'Accesorios y personalización' },
      { value: 'ninguno', label: 'Ninguno por ahora' }
    ]
  },

  // Improvements & Feedback (6 questions)
  {
    id: 'improvement',
    question: '¿En qué podríamos mejorar?',
    type: 'multiple-choice',
    options: [
      { value: 'mas-inventario', label: 'Más variedad de inventario' },
      { value: 'mejores-precios', label: 'Mejores precios' },
      { value: 'mas-informacion', label: 'Más información de vehículos' },
      { value: 'proceso-mas-rapido', label: 'Proceso más rápido' },
      { value: 'mejor-comunicacion', label: 'Mejor comunicación' },
      { value: 'todo-bien', label: 'Todo está bien' }
    ]
  },
  {
    id: 'financing-process-improvement',
    question: '¿De qué manera podríamos mejorar nuestro proceso de solicitud de financiamiento?',
    type: 'text',
    placeholder: 'Comparte tus sugerencias aquí...'
  },
  {
    id: 'completion-motivation',
    question: '¿Qué te motivó a completar tu solicitud hasta el final?',
    type: 'text',
    placeholder: 'Cuéntanos qué te mantuvo en el proceso...'
  },
  {
    id: 'near-abandonment',
    question: '¿Hubo algo que casi te hizo abandonar el proceso?',
    type: 'text',
    placeholder: 'Comparte tu experiencia...'
  },

  // Overall Satisfaction (3 questions)
  {
    id: 'satisfaction',
    question: '¿Qué tan satisfecho estás con tu experiencia en TREFA?',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Insatisfecho' },
      { value: '2', label: 'Poco satisfecho' },
      { value: '3', label: 'Satisfecho' },
      { value: '4', label: 'Muy satisfecho' }
    ]
  },
  {
    id: 'nps',
    question: '¿Qué tan probable es que recomiendes TREFA a un amigo?',
    type: 'rating-horizontal',
    min: 0,
    max: 10,
    labels: {
      min: 'Nada probable',
      max: 'Muy probable'
    }
  }
];

export default function AnonymousSurveyPage() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentQuestion + 1) / surveyQuestions.length) * 100;

  const generateCouponCode = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `TREFA${timestamp}${random}`.toUpperCase();
  };

  const saveSurveyResponse = async (surveyData: any) => {
    try {
      const { error } = await supabase
        .from('anonymous_survey_responses')
        .insert([
          {
            responses: surveyData,
            coupon_code: surveyData.coupon_code,
            completed_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error saving survey:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [surveyQuestions[currentQuestion].id]: value
    }));

    // Auto-advance to next question after a short delay (except for horizontal ratings)
    const currentType = surveyQuestions[currentQuestion]?.type;
    if (currentType !== 'rating-horizontal') {
      setTimeout(() => {
        if (currentQuestion < surveyQuestions.length - 1) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          handleComplete();
        }
      }, 400); // 400ms delay for smooth transition
    }
  };

  const handleNext = () => {
    if (currentQuestion < surveyQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    const code = generateCouponCode();
    setCouponCode(code);

    // Format responses to match analytics expectations: numeric keys instead of nested structure
    const surveyData = {
      ...answers,  // Spread answers directly (they already have numeric keys)
      coupon_code: code,
      timestamp: new Date().toISOString()
    };

    await saveSurveyResponse(surveyData);

    try {
      const qrUrl = await QRCode.toDataURL(code, {
        width: 300,
        margin: 2,
        color: {
          dark: '#ea580c',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (err) {
      console.error('Error generating QR:', err);
    }

    setIsCompleted(true);
    setIsSubmitting(false);
    toast.success('¡Gracias por completar la encuesta!');
  };

  const currentQuestionData = surveyQuestions[currentQuestion];
  // Text questions are optional, so they're always considered "answered"
  const isAnswered = currentQuestionData?.type === 'text' || answers[currentQuestionData?.id] !== undefined;

  // Welcome Screen
  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-orange-200">
            <CardHeader className="text-center space-y-6 pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                ¡Gana un cupón exclusivo!
              </CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Ayúdanos a mejorar y recibe un regalo especial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pb-8">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border-2 border-orange-200 space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">100% Anónimo</h3>
                    <p className="text-sm text-gray-700">
                      Tus respuestas son completamente anónimas y confidenciales
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Recibe tu recompensa</h3>
                    <p className="text-sm text-gray-700">
                      Al completar la encuesta recibirás un cupón con promociones y regalos especiales para tu compra
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-gray-900">Breve encuesta</p>
                <p className="text-gray-600">Toma solo unos minutos</p>
              </div>

              <Button
                onClick={() => setShowWelcome(false)}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
              >
                Comenzar encuesta
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <p className="text-center text-sm text-gray-500">
                Al participar aceptas compartir tus respuestas anónimas para mejorar nuestro servicio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-orange-200">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                ¡Gracias por tu tiempo!
              </CardTitle>
              <CardDescription className="text-lg text-gray-700">
                Tu opinión nos ayuda a mejorar cada día
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-700 font-medium">
                  Aquí está tu cupón de descuento exclusivo:
                </p>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-xl border-2 border-orange-300 shadow-inner">
                  <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Código de cupón</p>
                  <p className="text-3xl font-bold text-orange-600 mb-6 font-mono tracking-wider">
                    {couponCode}
                  </p>

                  {qrCodeUrl && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-3">Escanea este código QR:</p>
                      <div className="bg-white p-4 rounded-lg inline-block shadow-md">
                        <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mt-6">
                  <p className="text-sm text-amber-900 font-medium">
                    <strong>¿Cómo usar tu cupón?</strong><br/>
                    Presenta este código o escanea el QR al momento de tu compra para recibir promociones y regalos especiales.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    Imprimir cupón
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    Volver al inicio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Survey Questions
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="shadow-xl border-orange-100">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900 leading-relaxed">
              {currentQuestionData?.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Horizontal Rating */}
            {currentQuestionData?.type === 'rating-horizontal' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-2 px-2">
                  {Array.from({ length: (currentQuestionData.max - currentQuestionData.min + 1) }, (_, i) => {
                    const value = String(currentQuestionData.min + i);
                    const isSelected = answers[currentQuestionData.id] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleAnswer(value)}
                        className={`flex-1 aspect-square max-w-[60px] rounded-lg border-2 font-bold text-lg transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500 text-white shadow-lg scale-110'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-600 px-2">
                  <span>{currentQuestionData.labels.min}</span>
                  <span>{currentQuestionData.labels.max}</span>
                </div>
              </div>
            )}

            {/* Multiple Choice / Likert-4 */}
            {(currentQuestionData?.type === 'multiple-choice' || currentQuestionData?.type === 'likert-4') && (
              <RadioGroup
                value={answers[currentQuestionData?.id] || ''}
                onValueChange={handleAnswer}
                className="space-y-3"
              >
                {currentQuestionData?.options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      answers[currentQuestionData.id] === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="border-orange-500" />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer text-base font-medium text-gray-900"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Text Input */}
            {currentQuestionData?.type === 'text' && (
              <div className="space-y-3">
                <textarea
                  value={answers[currentQuestionData.id] || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestionData.id]: e.target.value }))}
                  placeholder={currentQuestionData.placeholder || 'Escribe tu respuesta aquí...'}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none text-base"
                />
                <p className="text-sm text-gray-500">
                  Esta pregunta es opcional. Puedes dejarla en blanco si prefieres.
                </p>
              </div>
            )}

            <Separator className="my-6" />

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="px-6 border-gray-300"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Anterior
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isAnswered || isSubmitting}
                className="px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
              >
                {currentQuestion === surveyQuestions.length - 1
                  ? isSubmitting
                    ? 'Enviando...'
                    : 'Finalizar'
                  : 'Siguiente'}
                {currentQuestion < surveyQuestions.length - 1 && (
                  <ArrowRight className="ml-2 w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          <p>Encuesta 100% anónima y segura</p>
        </div>
      </div>
    </div>
  );
}
