import axios from 'axios';

// Copiar directamente la función para evitar problemas de importación
async function callGeminiDirectlyTest(prompt) {
  try {
    const apiKey = 'AIzaSyD2IlrOxYhMs6aP9DwuDQph1ra8HAAhB3s';
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
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
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048
      }
    };
    
    console.log("Enviando solicitud a Gemini API...");
    
    const response = await axios.post(
      `${url}?key=${apiKey}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      return response.data.candidates[0].content.parts[0].text;
    } else {
      console.log('Formato de respuesta incorrecto', response.data);
      throw new Error('Formato de respuesta incorrecto');
    }
  } catch (error) {
    console.error('Error en llamada directa a Gemini API:', error.message);
    if (error.response) {
      console.error('Detalles de error:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

async function testChatResponse() {
  try {
    console.log("Enviando mensaje de prueba a la API de Gemini...");
    
    const prompt = `Eres un asistente inteligente para una aplicación de calendario y productividad llamada "AI Calendar Assistant".

Información del usuario:
Username: usuario_prueba

Información del calendario:
No hay eventos programados para la próxima semana.

Conversación previa:
No hay conversaciones previas.

Responde de manera útil y amigable. Si el usuario pregunta en español, responde en español.

Mensaje del usuario: Hola, ¿hay algo en mi calendario para hoy?

Tu respuesta:`;
    
    const respuesta = await callGeminiDirectlyTest(prompt);
    console.log("Respuesta del asistente:");
    console.log(respuesta);
  } catch (error) {
    console.error("Error al probar el chat:", error);
  }
}

testChatResponse();