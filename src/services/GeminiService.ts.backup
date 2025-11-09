import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

class GeminiService {
  private genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  /**
   * Enhance a roadmap feature description using Gemini AI
   * @param basicDescription - The basic feature description provided by the user
   * @returns Enhanced, detailed, and creative version of the feature description
   */
  async enhanceRoadmapFeature(basicDescription: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Eres un experto en producto y desarrollo de software para una plataforma de ventas de autos usados llamada TREFA.

Tu tarea es tomar la siguiente descripción básica de una funcionalidad y crear una descripción mejorada, detallada y creativa que incluya:
1. **Título atractivo y descriptivo** (máximo 60 caracteres)
2. **Descripción detallada** del problema que resuelve y los beneficios para usuarios/negocio (2-3 párrafos)
3. **Casos de uso específicos** (2-3 ejemplos concretos)
4. **Impacto esperado** (métricas o resultados esperados)
5. **Consideraciones técnicas** (tecnologías o integraciones clave)

Descripción básica del usuario:
"${basicDescription}"

Formato de respuesta:
---
TÍTULO: [Título conciso y atractivo]

DESCRIPCIÓN:
[Descripción detallada en 2-3 párrafos]

CASOS DE USO:
• [Caso 1]
• [Caso 2]
• [Caso 3]

IMPACTO ESPERADO:
[Métricas o beneficios cuantificables]

CONSIDERACIONES TÉCNICAS:
[Tecnologías, APIs, o integraciones relevantes]
---

Responde SOLO con el formato indicado, sin texto adicional.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error enhancing feature with Gemini:', error);
      throw new Error('No se pudo mejorar la descripción con IA. Intenta nuevamente.');
    }
  }

  /**
   * Generate a complete roadmap item from a basic user input
   */
  async generateRoadmapItem(basicIdea: string): Promise<{
    title: string;
    description: string;
    category: string;
    priority: string;
    estimatedTime: string;
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Eres un product manager experto para TREFA, una plataforma de ventas de autos usados.

Convierte la siguiente idea básica en un item de roadmap completo y estructurado:

"${basicIdea}"

Devuelve la respuesta en formato JSON con esta estructura exacta:
{
  "title": "Título conciso de la funcionalidad (máx 60 caracteres)",
  "description": "Descripción detallada de qué hace, qué problema resuelve, y beneficios esperados (2-3 párrafos)",
  "category": "Una de: Integración | Nueva Funcionalidad | Marketing | IA & Automatización | Optimización | Seguridad",
  "priority": "Alta | Media | Baja",
  "estimatedTime": "Ejemplo: 2-3 semanas, 1 mes, Q1 2026"
}

Responde ÚNICAMENTE con el objeto JSON, sin markdown ni texto adicional.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Error parsing Gemini JSON response:', parseError);
      }

      // Fallback if JSON parsing fails
      return {
        title: basicIdea.slice(0, 60),
        description: text,
        category: 'Nueva Funcionalidad',
        priority: 'Media',
        estimatedTime: 'Por definir'
      };
    } catch (error) {
      console.error('Error generating roadmap item with Gemini:', error);
      throw new Error('No se pudo generar el item con IA. Intenta nuevamente.');
    }
  }
}

export default new GeminiService();
