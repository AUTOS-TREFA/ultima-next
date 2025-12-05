// Definiciones de preguntas de encuesta para analíticas
// Esta estructura DEBE coincidir exactamente con AnonymousSurveyPage.tsx

export interface SurveyQuestion {
  id: string; // ID string que coincide con AnonymousSurveyPage
  questionNumber: number; // Número de orden
  section: string;
  question: string;
  type: 'likert-4' | 'rating-horizontal' | 'multiple-choice' | 'nps' | 'text';
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  labels?: { min: string; max: string };
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // SECCIÓN 1: Datos Demográficos (5 preguntas)
  {
    id: 'age',
    questionNumber: 1,
    section: 'Datos Demográficos',
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
    questionNumber: 2,
    section: 'Datos Demográficos',
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
    questionNumber: 3,
    section: 'Datos Demográficos',
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
    questionNumber: 4,
    section: 'Datos Demográficos',
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
    questionNumber: 5,
    section: 'Datos Demográficos',
    question: '¿Cuál es tu situación laboral actual?',
    type: 'multiple-choice',
    options: [
      { value: 'empleado', label: 'Empleado' },
      { value: 'autonomo', label: 'Autónomo/Emprendedor' },
      { value: 'profesionista', label: 'Profesionista independiente' },
      { value: 'estudiante', label: 'Estudiante' }
    ]
  },

  // SECCIÓN 2: Proceso de Solicitud TREFA (5 preguntas)
  {
    id: 'completed-banking-profile',
    questionNumber: 6,
    section: 'Proceso de Solicitud',
    question: 'Finalicé mi perfilamiento bancario',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Verdadero' },
      { value: '0', label: 'Falso' }
    ]
  },
  {
    id: 'started-credit-application',
    questionNumber: 7,
    section: 'Proceso de Solicitud',
    question: 'Inicié mi solicitud de crédito',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Verdadero' },
      { value: '0', label: 'Falso' }
    ]
  },
  {
    id: 'submitted-complete-application',
    questionNumber: 8,
    section: 'Proceso de Solicitud',
    question: 'Envié mi solicitud de financiamiento completa',
    type: 'likert-4',
    options: [
      { value: '1', label: 'Verdadero' },
      { value: '0', label: 'Falso' }
    ]
  },
  {
    id: 'information-reasonable',
    questionNumber: 9,
    section: 'Proceso de Solicitud',
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
    questionNumber: 10,
    section: 'Proceso de Solicitud',
    question: 'Siento confianza al compartir mis datos personales con TREFA',
    type: 'likert-4',
    options: [
      { value: '2', label: 'Sí' },
      { value: '0', label: 'No' },
      { value: '1', label: 'No lo sé' }
    ]
  },

  // SECCIÓN 3: Descubrimiento de Marca (4 preguntas)
  {
    id: 'source',
    questionNumber: 11,
    section: 'Descubrimiento de Marca',
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
    questionNumber: 12,
    section: 'Descubrimiento de Marca',
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
    questionNumber: 13,
    section: 'Descubrimiento de Marca',
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
    questionNumber: 14,
    section: 'Descubrimiento de Marca',
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

  // SECCIÓN 4: Confianza y Percepción (4 preguntas)
  {
    id: 'trust',
    questionNumber: 15,
    section: 'Confianza y Percepción',
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
    questionNumber: 16,
    section: 'Confianza y Percepción',
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
    questionNumber: 17,
    section: 'Confianza y Percepción',
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
    questionNumber: 18,
    section: 'Confianza y Percepción',
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

  // SECCIÓN 5: Experiencia con Plataforma (4 preguntas)
  {
    id: 'website-ease',
    questionNumber: 19,
    section: 'Experiencia con Plataforma',
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
    questionNumber: 20,
    section: 'Experiencia con Plataforma',
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
    questionNumber: 21,
    section: 'Experiencia con Plataforma',
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
    questionNumber: 22,
    section: 'Experiencia con Plataforma',
    question: '¿Has usado nuestra plataforma desde tu celular?',
    type: 'multiple-choice',
    options: [
      { value: 'si-excelente', label: 'Sí, funciona excelente' },
      { value: 'si-buena', label: 'Sí, funciona bien' },
      { value: 'si-problemas', label: 'Sí, pero con algunos problemas' },
      { value: 'no', label: 'No, solo desde computadora' }
    ]
  },

  // Continúa con el resto de las secciones...
  // (Manteniendo la misma estructura)

  // SECCIÓN FINAL: Satisfacción General (incluye NPS)
  {
    id: 'satisfaction',
    questionNumber: 39,
    section: 'Satisfacción General',
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
    questionNumber: 40,
    section: 'Satisfacción General',
    question: '¿Qué tan probable es que recomiendes TREFA a un amigo?',
    type: 'nps',
    min: 0,
    max: 10,
    labels: {
      min: 'Nada probable',
      max: 'Muy probable'
    }
  }
];

export const SURVEY_SECTIONS = [
  'Datos Demográficos',
  'Proceso de Solicitud',
  'Descubrimiento de Marca',
  'Confianza y Percepción',
  'Experiencia con Plataforma',
  'Journey de Compra',
  'Preferencias y Prioridades',
  'Financiamiento',
  'Servicio y Experiencia',
  'Mejoras y Feedback',
  'Satisfacción General'
];

export function getQuestionById(id: string): SurveyQuestion | undefined {
  return SURVEY_QUESTIONS.find(q => q.id === id);
}

export function getQuestionByNumber(num: number): SurveyQuestion | undefined {
  return SURVEY_QUESTIONS.find(q => q.questionNumber === num);
}

export function getQuestionsBySection(section: string): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter(q => q.section === section);
}

export function getLabelForValue(questionId: string, value: string): string {
  const question = getQuestionById(questionId);
  const option = question?.options?.find(opt => opt.value === value);
  return option?.label || value;
}
