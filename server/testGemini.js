import axios from 'axios';

async function testGemini() {
  try {
    const apiKey = 'AIzaSyD2IlrOxYhMs6aP9DwuDQph1ra8HAAhB3s';
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
    
    const data = {
      contents: [
        {
          parts: [
            {
              text: 'Responde con un "Hola, funciono correctamente" en español.'
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
    
    console.log('Respuesta de Gemini:');
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      console.log(response.data.candidates[0].content.parts[0].text);
    } else {
      console.log('Formato de respuesta incorrecto', response.data);
    }
  } catch (error) {
    console.error('Error al llamar a Gemini:', error.message);
    if (error.response) {
      console.error('Detalles del error:', JSON.stringify(error.response.data));
    }
  }
}

testGemini();