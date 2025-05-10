import axios from 'axios';

const GEMINI_API_KEY = 'AIzaSyD2IlrOxYhMs6aP9DwuDQph1ra8HAAhB3s';

/**
 * Implementación directa para llamar a la API de Gemini desde el frontend
 * Esta función replica la implementación del backend para asegurar consistencia
 */
export async function callGeminiDirectly(prompt: string): Promise<string> {
  try {
    console.log('Frontend: Enviando solicitud directa a Gemini API...');
    
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };
    
    const response = await axios.post(url, requestData);
    
    // Validar la respuesta
    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates.length > 0 &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts.length > 0
    ) {
      const generatedText = response.data.candidates[0].content.parts[0].text || '';
      console.log('Frontend: Respuesta recibida correctamente de Gemini API');
      return generatedText;
    } else {
      console.error('Frontend: Formato de respuesta inválido de Gemini API', response.data);
      return 'Lo siento, no pude procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.';
    }
  } catch (error: any) {
    console.error('Frontend: Error en llamada directa a Gemini API:', error.message);
    console.error('Frontend: Detalles de error:', error.response?.data || error);
    
    // Proporcionar un mensaje de error amigable
    return 'Estoy experimentando problemas de conexión. Por favor, intenta de nuevo en unos momentos.';
  }
}

/**
 * Función auxiliar para generar sugerencias de horarios
 */
export async function getScheduleSuggestions(): Promise<string> {
  const prompt = `
    Eres un asistente de productividad experto que ayuda a los usuarios a optimizar sus horarios y agenda.

    Por favor, proporciona 3 sugerencias útiles para:
    1. Mejores horarios para programar nuevas actividades
    2. Cómo organizar mejor la semana
    3. Un consejo para mejorar la productividad

    Cada sugerencia debe ser práctica, específica y accionable.
    Responde con viñetas y formato que sea fácil de leer.
    Usa un tono conversacional amigable, pero profesional.
  `;
  
  return await callGeminiDirectly(prompt);
}