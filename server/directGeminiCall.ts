import axios from 'axios';
import { log } from './vite';

// La API key directamente en código como solicitado por el usuario
const API_KEY = 'AIzaSyD2IlrOxYhMs6aP9DwuDQph1ra8HAAhB3s';

// Función para hacer una llamada directa a la API de Gemini versión gratuita usando Axios
export async function callGeminiDirectly(prompt: string): Promise<string> {
  try {
    // URL para la versión v1 (no v1beta) de la API
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
    
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
      ]
    };
    
    // Hacer la solicitud HTTP
    log('Enviando solicitud directa a Gemini API v1...', 'gemini');
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
      }
    } else {
      log(`Error desconocido en llamada a Gemini API: ${error}`, 'error');
    }
    throw error;
  }
}