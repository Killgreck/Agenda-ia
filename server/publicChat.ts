import { Express, Request, Response } from "express";
import { callGeminiDirectly } from "./directGeminiCall";
import { log } from "./vite";

// Ruta pública para probar el chat sin autenticación
export function registerPublicChatRoute(app: Express) {
  app.post("/api/public-chat", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: "Se requiere un mensaje" 
        });
      }
      
      // Log para depuración
      log(`Recibido mensaje para chat público: "${message}"`, 'gemini');
      
      // Crear un prompt simple para Gemini con el mensaje del usuario
      const prompt = `Eres un asistente inteligente para una aplicación de calendario y productividad llamada "AI Calendar Assistant".

Información del usuario:
Usuario de prueba (no autenticado)

Información del calendario:
No hay eventos programados.

Conversación previa:
Esta es una nueva conversación.

Responde de manera útil y amigable. Si el usuario pregunta en español, responde en español.

Mensaje del usuario: ${message}

Tu respuesta:`;
      
      log('Enviando solicitud a Gemini API para chat público...', 'gemini');
      
      // Llamar a la API de Gemini con el prompt
      const aiResponse = await callGeminiDirectly(prompt);
      
      log('Respuesta recibida de Gemini API para chat público', 'gemini');
      
      // Devolver la respuesta de la API
      return res.status(200).json({
        success: true,
        message: aiResponse
      });
    } catch (error) {
      log(`Error en chat público: ${error}`, 'error');
      
      // Crear un mensaje de error amigable
      let errorMessage = "Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo en un momento.";
      
      // Responder con el error
      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  });
  
  log('Ruta de chat público registrada en /api/public-chat', 'gemini');
}