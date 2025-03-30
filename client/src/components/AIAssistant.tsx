import { useState, useRef, useEffect } from "react";
import { Bot, Send, Mic, Clock, CalendarDays, HelpCircle, User } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTaskManager";
import { type ChatMessage } from "@/types/chat";
import { useLocalMessages } from "@/hooks/useLocalMessages";

// Define adapter function to convert between message formats if needed
const adaptMessage = (message: any): ChatMessage => {
  return {
    id: message.id || Date.now(),
    content: message.content,
    timestamp: message.timestamp,
    sender: message.sender === 'user' ? 'user' : message.sender === 'ai' ? 'ai' : 'system'
  };
};

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [apiError, setApiError] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { messages: aiMessages, sendMessage, isTyping } = useAI();
  const { messages, addUserMessage, addAIMessage } = useLocalMessages(aiMessages);
  
  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  
  // Check if there are any messages beyond the initial greeting
  // If not and we have attempted communication, show API connection error
  useEffect(() => {
    // If there are messages and one of them indicates an API error
    const hasApiError = messages.some(msg => 
      msg.content.includes("trouble connecting") || 
      msg.content.includes("having trouble processing") || 
      msg.content.includes("connection is restored") ||
      msg.content.includes("once I'm back online"));
    
    setApiError(hasApiError);
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Create a clean version of the message to display
    const cleanMessage = message.trim();
    
    // Check if this message is related to gym/workouts
    const isWorkoutRelated = cleanMessage.toLowerCase().includes('gym') || 
                            cleanMessage.toLowerCase().includes('workout') || 
                            cleanMessage.toLowerCase().includes('exercise') ||
                            cleanMessage.toLowerCase().includes('three times a week') ||
                            cleanMessage.toLowerCase().includes('gimnasio') ||
                            cleanMessage.toLowerCase().includes('ejercicio');
    
    // Check if this message is related to scheduling/calendar
    const isSchedulingRelated = cleanMessage.toLowerCase().includes('schedule') || 
                               cleanMessage.toLowerCase().includes('calendar') || 
                               cleanMessage.toLowerCase().includes('appointment') ||
                               cleanMessage.toLowerCase().includes('meeting') ||
                               cleanMessage.toLowerCase().includes('agendar') ||
                               cleanMessage.toLowerCase().includes('calendario') ||
                               cleanMessage.toLowerCase().includes('reunión') ||
                               cleanMessage.toLowerCase().includes('cita');
    
    // Check for Spanish language
    const isSpanish = cleanMessage.toLowerCase().includes('quiero') || 
                      cleanMessage.toLowerCase().includes('agendar') || 
                      cleanMessage.toLowerCase().includes('calendario') ||
                      cleanMessage.toLowerCase().includes('gimnasio') ||
                      cleanMessage.toLowerCase().includes('ejercicio') ||
                      cleanMessage.toLowerCase().includes('reunión') ||
                      cleanMessage.toLowerCase().includes('cita') ||
                      cleanMessage.toLowerCase().includes('hola') ||
                      cleanMessage.toLowerCase().includes('gracias') ||
                      cleanMessage.toLowerCase().includes('por favor');
    
    // Check for API error condition before sending
    const hasApiError = messages.some(msg => 
      msg.content.includes("trouble connecting") || 
      msg.content.includes("having trouble processing") || 
      msg.content.includes("connection is restored") ||
      msg.content.includes("once I'm back online"));
    
    // If we have detected an API error and this is a specific type of message we can handle locally
    if (hasApiError) {
      // First add the user message
      addUserMessage(cleanMessage);
      
      // Handle different message types with contextual responses
      if (isWorkoutRelated) {
        // Create contextual gym-related response based on language
        const gymResponse = isSpanish
          ? "Para tu rutina de gimnasio tres veces por semana, recomiendo programar en lunes, miércoles y viernes en horarios consistentes, idealmente por la mañana (6-8 AM) o por la tarde (5-7 PM) cuando los niveles de energía son óptimos. ¿Te gustaría que agregue estas sesiones recurrentes a tu calendario?"
          : "For your gym routine three times a week, I recommend scheduling on Monday, Wednesday, and Friday at consistent times, ideally morning (6-8 AM) or evening (5-7 PM) when energy levels are optimal. Would you like me to add these recurring sessions to your calendar?";
        
        // Add AI response with a small delay
        addAIMessage(gymResponse, 1500);
      } 
      else if (isSchedulingRelated) {
        // Create contextual scheduling-related response based on language
        const schedulingResponse = isSpanish
          ? "Puedo ayudarte a programar eventos en tu calendario. Por favor, proporciona los detalles como el título, la fecha, la hora y si es un evento recurrente. Por ejemplo: 'Programar una reunión de equipo el lunes a las 10 AM'."
          : "I can help you schedule events on your calendar. Please provide details like title, date, time, and whether it's a recurring event. For example: 'Schedule a team meeting on Monday at 10 AM'.";
        
        // Add AI response with a small delay
        addAIMessage(schedulingResponse, 1500);
      }
      else {
        // Generic fallback response based on language
        const fallbackResponse = isSpanish
          ? "Lo siento, estoy teniendo problemas para conectarme al servicio de IA en este momento. Puedo ayudarte con tareas básicas como programación de eventos y recomendaciones de ejercicios. ¿En qué más puedo ayudarte?"
          : "I'm sorry, I'm having trouble connecting to the AI service right now. I can help with basic tasks like event scheduling and exercise recommendations. What else can I assist you with?";
        
        // Add AI response with a small delay
        addAIMessage(fallbackResponse, 1500);
      }
    } else {
      // Use normal API-based flow for all other cases
      sendMessage(cleanMessage);
    }
    
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 flex items-center">
          <Bot className="text-accent mr-2 h-5 w-5" />
          AI Assistant
        </h2>
        <p className="text-sm text-gray-500 mt-1">Powered by Abacus LLM</p>
        
        {apiError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <p>
              <strong>Connection Issue:</strong> Currently unable to connect to the Abacus AI service. The system is 
              still operational, but advanced AI features are limited until connectivity is restored.
            </p>
            <p className="mt-1 text-xs text-red-600">
              The API may be experiencing high demand or temporary maintenance. Basic scheduling functions 
              continue to work normally.
            </p>
          </div>
        )}
      </div>
      
      {/* Chat Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" 
        id="chat-messages"
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start ${msg.sender === 'ai' ? '' : 'justify-end'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-white">
                <Bot className="h-4 w-4" />
              </div>
            )}
            
            <div 
              className={`${
                msg.sender === 'ai' 
                  ? 'ml-3 bg-accent text-white rounded-lg rounded-tl-none relative ai-message' 
                  : 'mr-3 bg-primary text-white rounded-lg rounded-tr-none relative user-message'
              } p-3 max-w-[80%]`}
            >
              <p className="text-sm whitespace-pre-line">{msg.content}</p>
            </div>
            
            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center flex-shrink-0 text-white">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="ml-3 bg-gray-200 rounded-lg p-2 rounded-tl-none">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <Input 
            type="text" 
            placeholder="Ask your AI assistant..." 
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            className="bg-accent text-white px-4 py-2 rounded-r-lg hover:bg-accent-dark"
            onClick={handleSendMessage}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <Button variant="ghost" size="sm" className="text-xs p-1 h-6 hover:text-accent">
            <Mic className="h-3 w-3 mr-1" />
            Voice
          </Button>
          <Button variant="ghost" size="sm" className="text-xs p-1 h-6 hover:text-accent">
            <Clock className="h-3 w-3 mr-1" />
            Quick Schedule
          </Button>
          <Button variant="ghost" size="sm" className="text-xs p-1 h-6 hover:text-accent">
            <CalendarDays className="h-3 w-3 mr-1" />
            Event Template
          </Button>
          <Button variant="ghost" size="sm" className="text-xs p-1 h-6 hover:text-accent">
            <HelpCircle className="h-3 w-3 mr-1" />
            Help
          </Button>
        </div>
      </div>
    </div>
  );
}
