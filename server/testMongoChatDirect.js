import mongoose from 'mongoose';
import { ChatMessage } from './mongoModels.ts';
import { callGeminiDirectly } from './directGeminiCall.ts';
import { getNextSequenceValue } from './mongodb.ts';
import { log } from './vite.ts';

// Variables de conexión a MongoDB - usando la misma que en la aplicación
const MONGODB_URI = 'mongodb+srv://Agenda:iN6kazxV3HA46qPN@cluster0.72j4r.mongodb.net/productivity-app?retryWrites=true&w=majority&connectTimeoutMS=15000&socketTimeoutMS=45000&appName=Cluster0';

// Función principal para probar la funcionalidad
async function testChatWithMongo() {
  try {
    console.log("Iniciando prueba de integración MongoDB y Gemini...");
    
    // Conectar a MongoDB con las mismas opciones que usa la aplicación
    console.log("Conectando a MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
      ssl: true
    });
    console.log("Conexión a MongoDB establecida con éxito");
    
    // ID de usuario de prueba
    const userId = 1;
    
    // Generar un mensaje de usuario para probar
    const userMessageContent = "Hola, ¿hay algo en mi calendario para hoy?";
    console.log(`Creando mensaje de usuario: "${userMessageContent}"`);
    
    // Generar un ID secuencial para el mensaje
    const messageId = await getNextSequenceValue('chatMessages', userId);
    
    // Crear objeto de mensaje
    const userMessage = new ChatMessage({
      id: messageId,
      userId: userId,
      content: userMessageContent,
      timestamp: new Date(),
      sender: 'user'
    });
    
    // Guardar el mensaje del usuario
    await userMessage.save();
    console.log(`Mensaje de usuario guardado con ID: ${messageId}`);
    
    // Obtener información del perfil (simulada para la prueba)
    const userProfile = "Username: usuario_prueba";
    
    // Obtener información del calendario (simulada para la prueba)
    const calendarEvents = "No hay eventos programados para la próxima semana.";
    
    // Obtener mensajes anteriores
    const previousMessages = "No hay conversaciones previas.";
    
    // Crear el prompt para Gemini
    const prompt = `Eres un asistente inteligente para una aplicación de calendario y productividad llamada "AI Calendar Assistant".

Información del usuario:
${userProfile}

Información del calendario:
${calendarEvents}

Conversación previa:
${previousMessages}

Responde de manera útil y amigable. Si el usuario pregunta en español, responde en español.

Mensaje del usuario: ${userMessageContent}

Tu respuesta:`;
    
    console.log("Enviando solicitud a Gemini API...");
    
    // Llamar a la API de Gemini
    const aiResponse = await callGeminiDirectly(prompt);
    console.log("Respuesta recibida de Gemini API:");
    console.log(aiResponse);
    
    // Crear mensaje de respuesta del AI
    const aiMessageId = await getNextSequenceValue('chatMessages', userId);
    const aiMessage = new ChatMessage({
      id: aiMessageId,
      userId: userId,
      content: aiResponse,
      timestamp: new Date(),
      sender: 'ai'
    });
    
    // Guardar el mensaje del AI
    await aiMessage.save();
    console.log(`Mensaje de AI guardado con ID: ${aiMessageId}`);
    
    // Recuperar los mensajes almacenados para verificar
    const messages = await ChatMessage.find({ userId }).sort({ timestamp: -1 }).limit(5);
    console.log("Últimos 5 mensajes almacenados:");
    messages.forEach(msg => {
      console.log(`[${msg.sender}]: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    });
    
    console.log("Prueba completada con éxito");
  } catch (error) {
    console.error("Error durante la prueba:", error);
  } finally {
    // Cerrar la conexión a MongoDB
    await mongoose.connection.close();
    console.log("Conexión a MongoDB cerrada");
  }
}

// Ejecutar la prueba
testChatWithMongo();