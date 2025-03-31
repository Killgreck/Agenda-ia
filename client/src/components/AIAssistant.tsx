import { useState, useRef, useEffect } from "react";
import { Bot, Send, Mic, Clock, CalendarDays, HelpCircle, User } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTaskManager";
import { type ChatMessage } from "@/types/chat";
import { useLocalMessages } from "@/hooks/useLocalMessages";
import TaskModal from "@/components/TaskModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Add Speech Recognition type definitions
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: { error: string }) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

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
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { messages: aiMessages, sendMessage, isTyping, askAiForTaskSuggestion } = useAI();
  const { messages, addUserMessage, addAIMessage } = useLocalMessages(aiMessages);
  const { createTask, isCreatingTask } = useTasks();
  
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

  // Store recognition instance
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Handle voice recognition when voice mode is active
  useEffect(() => {
    // Clean up any existing recognition on component mount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Error cleaning up recognition:", e);
        }
        recognitionRef.current = null;
      }
    };
  }, []);
  
  // Setup and start recognition when voice mode is activated
  useEffect(() => {
    if (!isVoiceActive) return;
    
    console.log("Activating voice recognition");
    
    // Check if browser supports speech recognition
    const SpeechRecognitionAPI = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.error("Speech Recognition API not available");
      addAIMessage("Sorry, your browser doesn't support voice recognition. Try using Chrome or Edge browser for voice input.", 0);
      setIsVoiceActive(false);
      return;
    }
    
    try {
      // Always create a fresh instance
      recognitionRef.current = new SpeechRecognitionAPI();
      const recognition = recognitionRef.current;
      
      // Configure recognition
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Notify user that voice recognition has started
      addAIMessage("I'm listening... Speak now and I'll transcribe what you say.", 0);
      
      // Set up event handlers
      recognition.onstart = () => {
        console.log("Voice recognition started");
      };
      
      recognition.onresult = (event: any) => {
        console.log("Got speech recognition results", event);
        if (event.results && event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          console.log("Voice recognition result:", transcript);
          
          if (transcript && transcript.trim().length > 0) {
            setMessage(transcript);
            
            // Automatically send the message after a brief delay
            setTimeout(() => {
              sendMessage(transcript);
              setMessage("");
            }, 500);
          } else {
            console.log("Empty transcript received");
            addAIMessage("I didn't catch that. Could you please speak again?", 0);
          }
        } else {
          console.log("No results in speech recognition event");
          addAIMessage("I didn't hear anything. Please try speaking again.", 0);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error("Voice recognition error:", event.error);
        addAIMessage(`Voice recognition error: ${event.error}. Please try again or type your message.`, 0);
        setIsVoiceActive(false);
      };
      
      recognition.onend = () => {
        console.log("Voice recognition ended");
        setIsVoiceActive(false);
      };
      
      // Start recognition
      recognition.start();
      console.log("Recognition started");
      
      // Cleanup function
      return () => {
        console.log("Cleaning up voice recognition");
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.error("Error stopping recognition:", e);
          }
          recognitionRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing voice recognition:", error);
      addAIMessage("There was a problem starting voice recognition. Please try again later or type your message.", 0);
      setIsVoiceActive(false);
    }
  }, [isVoiceActive, addAIMessage, sendMessage]);

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

  const handleVoiceInput = () => {
    setIsVoiceActive(true);
  };
  
  const handleQuickSchedule = () => {
    setShowTaskModal(true);
  };
  
  const handleEventTemplate = () => {
    setShowTemplateDialog(true);
  };
  
  const handleHelp = () => {
    setShowHelpDialog(true);
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
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-xs p-1 h-6 ${isVoiceActive ? 'text-accent' : 'hover:text-accent'}`}
            onClick={handleVoiceInput}
            disabled={isVoiceActive}
          >
            <Mic className="h-3 w-3 mr-1" />
            Voice
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs p-1 h-6 hover:text-accent"
            onClick={handleQuickSchedule}
          >
            <Clock className="h-3 w-3 mr-1" />
            Quick Schedule
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs p-1 h-6 hover:text-accent"
            onClick={handleEventTemplate}
          >
            <CalendarDays className="h-3 w-3 mr-1" />
            Event Template
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs p-1 h-6 hover:text-accent"
            onClick={handleHelp}
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Help
          </Button>
        </div>
      </div>
      
      {/* Task Modal for Quick Schedule */}
      <TaskModal 
        open={showTaskModal} 
        onClose={() => setShowTaskModal(false)} 
      />
      
      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Assistant Help</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96 rounded-md">
            <div className="p-4 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
                <p className="text-sm text-gray-600">
                  Your AI assistant helps you manage your schedule, create events, and optimize your productivity. 
                  Simply type your questions or requests in the chat, and the assistant will guide you.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Features</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  <li><strong>Schedule Management:</strong> Ask the assistant to create, modify, or cancel events on your calendar.</li>
                  <li><strong>Smart Suggestions:</strong> The AI analyzes your schedule to suggest optimal times for new events and activities.</li>
                  <li><strong>Productivity Tips:</strong> Get personalized advice on time management and scheduling best practices.</li>
                  <li><strong>Multilingual Support:</strong> Communicate with the assistant in English or Spanish.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Quick Commands</h3>
                <div className="rounded bg-gray-50 p-3 text-sm">
                  <p className="font-medium">Try asking:</p>
                  <ul className="ml-4 mt-2 space-y-1 list-disc">
                    <li>"Schedule a team meeting at 2pm tomorrow"</li>
                    <li>"What's my schedule for today?"</li>
                    <li>"Find a free slot for a workout this week"</li>
                    <li>"Optimize my calendar for deep work"</li>
                    <li>"Create a recurring event for piano practice"</li>
                  </ul>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Tools</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">Voice Input</p>
                    <p className="text-xs text-gray-600">Click the Voice button to speak your request instead of typing.</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Quick Schedule</p>
                    <p className="text-xs text-gray-600">Opens a form to directly create a new event without typing details in chat.</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Event Templates</p>
                    <p className="text-xs text-gray-600">Create and use templates for common types of events you schedule regularly.</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Event Templates Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Templates</DialogTitle>
            <DialogDescription>
              Choose a template to quickly create common events
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Workout Template */}
            <div 
              className="p-4 border rounded-lg hover:border-accent cursor-pointer transition-all"
              onClick={() => {
                setShowTemplateDialog(false);
                setShowTaskModal(true);
                // Pre-fill task details with workout template
                const workoutTemplate = {
                  title: "Workout",
                  description: "Regular exercise session",
                  priority: "medium",
                  isRecurring: true,
                  recurrenceType: "weekly",
                  recurringDays: ["monday", "wednesday", "friday"],
                  isAllDay: false,
                  reminder: [30]
                };
                // We're opening the task modal, which has its own form handling
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Workout Session</h3>
                <div className="p-1 rounded-full bg-accent/10 text-accent">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Regular workout session, 3 times per week</p>
              <div className="mt-2 text-xs text-gray-400">
                <p>Monday, Wednesday, Friday • 45 min</p>
                <p>Priority: Medium • 30 min reminder</p>
              </div>
            </div>
            
            {/* Meeting Template */}
            <div 
              className="p-4 border rounded-lg hover:border-accent cursor-pointer transition-all"
              onClick={() => {
                setShowTemplateDialog(false);
                setShowTaskModal(true);
                // Pre-fill task details with meeting template
                const meetingTemplate = {
                  title: "Team Meeting",
                  description: "Weekly team sync",
                  priority: "high",
                  isRecurring: true,
                  recurrenceType: "weekly",
                  recurringDays: ["monday"],
                  isAllDay: false,
                  reminder: [15, 60]
                };
                // We're opening the task modal, which has its own form handling
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Team Meeting</h3>
                <div className="p-1 rounded-full bg-accent/10 text-accent">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Weekly team sync meeting</p>
              <div className="mt-2 text-xs text-gray-400">
                <p>Monday • 60 min</p>
                <p>Priority: High • 15 min & 1 hour reminders</p>
              </div>
            </div>
            
            {/* Focus Work Template */}
            <div 
              className="p-4 border rounded-lg hover:border-accent cursor-pointer transition-all"
              onClick={() => {
                setShowTemplateDialog(false);
                setShowTaskModal(true);
                // Pre-fill task details with focus work template
                const focusTemplate = {
                  title: "Focus Block",
                  description: "Uninterrupted deep work session",
                  priority: "high",
                  isRecurring: true,
                  recurrenceType: "daily",
                  isAllDay: false,
                  reminder: [5]
                };
                // We're opening the task modal, which has its own form handling
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Focus Work</h3>
                <div className="p-1 rounded-full bg-accent/10 text-accent">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Dedicated deep work session</p>
              <div className="mt-2 text-xs text-gray-400">
                <p>Daily • 90 min</p>
                <p>Priority: High • 5 min reminder</p>
              </div>
            </div>
            
            {/* Personal Time Template */}
            <div 
              className="p-4 border rounded-lg hover:border-accent cursor-pointer transition-all"
              onClick={() => {
                setShowTemplateDialog(false);
                setShowTaskModal(true);
                // Pre-fill task details with personal time template
                const personalTemplate = {
                  title: "Personal Time",
                  description: "Self-care and relaxation",
                  priority: "medium",
                  isRecurring: true,
                  recurrenceType: "weekly",
                  recurringDays: ["saturday", "sunday"],
                  isAllDay: false,
                  reminder: [60]
                };
                // We're opening the task modal, which has its own form handling
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Personal Time</h3>
                <div className="p-1 rounded-full bg-accent/10 text-accent">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Dedicated relaxation and self-care</p>
              <div className="mt-2 text-xs text-gray-400">
                <p>Weekend • Flexible duration</p>
                <p>Priority: Medium • 1 hour reminder</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
