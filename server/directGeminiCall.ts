import axios from 'axios';
import { log } from './vite';
import { getMockResponse, getMockWeeklyReport, getMockTaskSuggestion } from './mockAssistantResponses';

// Variable para controlar el estado de la API de Gemini
let isGeminiQuotaExceeded = false;
let quotaResetTimeEstimate: Date | null = null;

// La API key directamente en código como solicitado por el usuario
const API_KEY = 'AIzaSyD2IlrOxYhMs6aP9DwuDQph1ra8HAAhB3s';

// Función para extraer el tiempo de espera sugerido desde el error de la API
function extractRetryDelayFromError(errorData: any): number {
  try {
    if (errorData?.error?.details) {
      // Buscar el objeto RetryInfo en los detalles del error
      const retryInfoDetail = errorData.error.details.find(
        (detail: any) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
      );
      
      if (retryInfoDetail && retryInfoDetail.retryDelay) {
        // El formato suele ser "13s" o similar, extrae el número
        const delayStr = retryInfoDetail.retryDelay;
        const delaySeconds = parseInt(delayStr.replace(/[^0-9]/g, ''));
        if (!isNaN(delaySeconds)) {
          return delaySeconds;
        }
      }
    }
  } catch (e) {
    log(`Error al extraer retryDelay del error: ${e}`, 'error');
  }
  
  // Valor predeterminado de 60 segundos si no se puede extraer
  return 60;
}

// Función para hacer una llamada directa a la API de Gemini versión gratuita usando Axios
export async function callGeminiDirectly(prompt: string, isTaskSuggestion = false, isWeeklyReport = false, statsForReport?: any): Promise<string> {
  // Si ya sabemos que se excedió la cuota, usamos las respuestas simuladas inmediatamente
  if (isGeminiQuotaExceeded) {
    const currentTime = new Date();
    if (quotaResetTimeEstimate && currentTime < quotaResetTimeEstimate) {
      const timeRemaining = Math.round((quotaResetTimeEstimate.getTime() - currentTime.getTime()) / 1000);
      
      log(`Usando respuesta simulada porque la cuota de Gemini está excedida. Reintentando en ~${timeRemaining} segundos`, 'gemini');
      
      if (isTaskSuggestion) {
        // Extraer título y descripción del prompt para la sugerencia de tarea
        const titleMatch = prompt.match(/Task Title: (.*?)(?:\n|$)/);
        const descMatch = prompt.match(/Task Description: (.*?)(?:\n|$)/);
        
        const title = titleMatch ? titleMatch[1].trim() : "tarea sin título";
        const description = descMatch ? descMatch[1].trim() : undefined;
        
        return getMockTaskSuggestion(title, description);
      } 
      else if (isWeeklyReport) {
        return getMockWeeklyReport(statsForReport || {});
      }
      else {
        // Para mensajes generales del chat
        const userMessageMatch = prompt.match(/Mensaje del usuario: (.*?)(?:\n|Tu respuesta:|$)/s);
        const userMessage = userMessageMatch ? userMessageMatch[1].trim() : prompt;
        
        return getMockResponse(userMessage);
      }
    } else {
      // Resetear el flag si ya pasó el tiempo estimado
      isGeminiQuotaExceeded = false;
      quotaResetTimeEstimate = null;
    }
  }
  
  try {
    // Usar el modelo gemini-1.5-flash que está disponible en la versión gratuita
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
    // Los parámetros para la solicitud
    const data = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      // Configuraciones recomendadas para gemini-1.5-flash
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048
      }
    };
    
    // Hacer la solicitud HTTP
    log('Enviando solicitud directa a Gemini API v1 con modelo gemini-1.5-flash...', 'gemini');
    const response = await axios.post(
      `${url}?key=${API_KEY}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Verificar que la respuesta tenga el formato correcto
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      log('Respuesta recibida correctamente de Gemini API', 'gemini');
      return response.data.candidates[0].content.parts[0].text;
    } else {
      log('Respuesta de Gemini API no tiene el formato esperado', 'error');
      throw new Error('Formato de respuesta incorrecto');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      log(`Error en llamada directa a Gemini API: ${error.message}`, 'error');
      
      if (error.response) {
        log(`Detalles de error: ${JSON.stringify(error.response.data)}`, 'error');
        
        // Verificar si es un error de cuota excedida (código 429)
        if (error.response.status === 429) {
          // Marcar que la cuota está excedida
          isGeminiQuotaExceeded = true;
          
          // Extraer el tiempo de espera sugerido desde la respuesta
          const retryDelaySeconds = extractRetryDelayFromError(error.response.data);
          
          // Configurar tiempo estimado de reset de cuota (añadir un buffer por seguridad)
          quotaResetTimeEstimate = new Date(Date.now() + (retryDelaySeconds + 10) * 1000);
          
          log(`Límite de cuota de Gemini excedido. Cambiando a respuestas simuladas durante ~${retryDelaySeconds} segundos`, 'gemini');
          
          // Proporcionar respuesta simulada según el tipo de solicitud
          if (isTaskSuggestion) {
            // Extraer título y descripción del prompt para la sugerencia de tarea
            const titleMatch = prompt.match(/Task Title: (.*?)(?:\n|$)/);
            const descMatch = prompt.match(/Task Description: (.*?)(?:\n|$)/);
            
            const title = titleMatch ? titleMatch[1].trim() : "tarea sin título";
            const description = descMatch ? descMatch[1].trim() : undefined;
            
            return getMockTaskSuggestion(title, description);
          } 
          else if (isWeeklyReport) {
            return getMockWeeklyReport(statsForReport || {});
          }
          else {
            // Para mensajes generales del chat
            const userMessageMatch = prompt.match(/Mensaje del usuario: (.*?)(?:\n|Tu respuesta:|$)/s);
            const userMessage = userMessageMatch ? userMessageMatch[1].trim() : prompt;
            
            return getMockResponse(userMessage);
          }
        }
      }
    } else {
      log(`Error desconocido en llamada a Gemini API: ${error}`, 'error');
    }
    
    // Re-lanzar el error para que se maneje en el nivel superior
    throw error;
  }
}