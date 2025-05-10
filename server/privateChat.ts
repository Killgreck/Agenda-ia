import { Express, Request, Response } from "express";
import { callGeminiDirectly } from "./directGeminiCall";
import { log } from "./vite";
import { storage } from "./storage";

// Ruta privada de chat que requiere autenticación
export function registerPrivateChatRoute(app: Express) {
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      // Verificar si el usuario está autenticado
      if (!req.isAuthenticated()) {
        return res.status(401).json({ 
          success: false, 
          message: "No autenticado" 
        });
      }
      
      const { message } = req.body;
      const user = req.user;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: "Se requiere un mensaje" 
        });
      }
      
      // Log para depuración
      log(`Recibido mensaje de chat del usuario ${user.id}: "${message}"`, 'gemini');
      
      // Obtener las últimas conversaciones para contexto (si existen)
      const recentMessages = await storage.getChatMessages(5, user.id);
      const conversationHistory = recentMessages.map(msg => 
        `${msg.sender === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
      ).join('\n');
      
      // Crear un prompt para Gemini con el mensaje del usuario y su información
      const prompt = `Eres un asistente inteligente para una aplicación de calendario y productividad llamada "AI Calendar Assistant".

Información del usuario:
ID: ${user.id}
Nombre de usuario: ${user.username}
Correo: ${user.email || 'No disponible'}

Información del calendario:
[Eventos actuales del usuario no disponibles en este momento]

Conversación previa:
${conversationHistory || 'Esta es una nueva conversación.'}

Responde de manera útil y amigable. Si el usuario pregunta en español, responde en español.

Mensaje del usuario: ${message}

Tu respuesta:`;
      
      log('Enviando solicitud a Gemini API...', 'gemini');
      
      // Llamar a la API de Gemini con el prompt
      const aiResponse = await callGeminiDirectly(prompt);
      
      log('Respuesta recibida de Gemini API', 'gemini');
      
      // Guardar el mensaje del usuario en la base de datos
      await storage.createChatMessage({
        userId: user.id,
        content: message,
        timestamp: new Date().toISOString(),
        sender: 'user'
      });
      
      // Guardar la respuesta del asistente en la base de datos
      await storage.createChatMessage({
        userId: user.id,
        content: aiResponse,
        timestamp: new Date().toISOString(),
        sender: 'ai'
      });
      
      // Devolver la respuesta de la API
      return res.status(200).json({
        success: true,
        message: aiResponse
      });
    } catch (error) {
      log(`Error en chat: ${error}`, 'error');
      
      // Crear un mensaje de error amigable
      let errorMessage = "Lo siento, estoy teniendo problemas para conectarme. Por favor, intenta de nuevo en un momento.";
      
      // Responder con el error
      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  });
  
  // Solo mantenemos la ruta privada que requiere autenticación
  log('Ruta de chat privado registrada en /api/chat (requiere autenticación)', 'gemini');
}