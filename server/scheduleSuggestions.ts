import { log } from './vite';
import { Express, Request, Response } from 'express';
import { callGeminiDirectly } from './directGeminiCall';

/**
 * Obtiene sugerencias de horarios utilizando Gemini API
 */
export async function getScheduleSuggestions(events: any[] = []): Promise<string> {
  try {
    // Crear una representación de los eventos actuales
    let eventsText = '';
    
    if (events.length === 0) {
      eventsText = 'No hay eventos programados actualmente.';
    } else {
      eventsText = events.map(event => {
        const date = new Date(event.date).toLocaleDateString();
        const time = new Date(event.date).toLocaleTimeString();
        return `- ${event.title} (${date} a las ${time})`;
      }).join('\\n');
    }
    
    // Crear el prompt para Gemini
    const prompt = `Eres un asistente de calendario inteligente. Tu tarea es proporcionar sugerencias útiles de horarios y organización para la semana.

Eventos actuales del usuario:
${eventsText}

Por favor, proporciona tres sugerencias específicas sobre:
1. Los mejores horarios para programar nuevas actividades
2. Cómo organizar mejor la semana
3. Un consejo para mejorar la productividad relacionado con la gestión del tiempo

Da tu respuesta en formato de lista numerada con sugerencias breves y prácticas. No uses más de 3-4 líneas por sugerencia.
Tu respuesta:`;

    log('Enviando solicitud a Gemini para obtener sugerencias de horarios...', 'gemini');
    
    // Llamar a la API de Gemini
    const response = await callGeminiDirectly(prompt);
    
    log('Respuesta de sugerencias de horarios recibida correctamente', 'gemini');
    
    return response;
  } catch (error) {
    log(`Error al obtener sugerencias de horarios: ${error}`, 'error');
    return "Lo siento, no pude generar sugerencias en este momento. Por favor, intenta más tarde.";
  }
}

/**
 * Registra una ruta en el servidor para obtener sugerencias de horarios
 */
export function registerScheduleSuggestionsRoute(app: Express) {
  app.get('/api/schedule-suggestions', async (req: Request, res: Response) => {
    try {
      const suggestions = await getScheduleSuggestions();
      
      res.status(200).json({
        success: true,
        suggestions
      });
    } catch (error) {
      log(`Error en ruta de sugerencias de horarios: ${error}`, 'error');
      
      res.status(500).json({
        success: false,
        message: 'Error al generar sugerencias de horarios'
      });
    }
  });
  
  log('Ruta de sugerencias de horarios registrada en /api/schedule-suggestions', 'gemini');
}