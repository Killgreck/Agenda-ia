import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Lock } from "lucide-react";
import axios from "axios";
import { useNavigate } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Interface para los mensajes
interface ChatMessage {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function PrivateChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      content: "¡Hola! Soy tu asistente AI de calendario. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  // Redirigir al login si no está autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  // Función para enviar un mensaje al endpoint
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    // Crear nuevo mensaje del usuario
    const userMessage: ChatMessage = {
      id: messages.length + 1,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    // Actualizar la interfaz con el mensaje del usuario
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Enviar solicitud al endpoint privado que requiere autenticación
      const response = await axios.post('/api/chat', {
        message: inputValue
      });

      // Si la solicitud fue exitosa
      if (response.data.success) {
        // Crear nuevo mensaje de respuesta del bot
        const botResponse: ChatMessage = {
          id: messages.length + 2,
          content: response.data.message,
          sender: "bot",
          timestamp: new Date(),
        };

        // Actualizar la interfaz con la respuesta del bot
        setMessages((prev) => [...prev, botResponse]);
      } else {
        // Mostrar mensaje de error si la solicitud no fue exitosa
        const errorMessage: ChatMessage = {
          id: messages.length + 2,
          content: "Lo siento, hubo un problema al procesar tu solicitud. Por favor, intenta de nuevo.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      
      // Verificar si es un error de autenticación
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const authErrorMessage: ChatMessage = {
          id: messages.length + 2,
          content: "Necesitas iniciar sesión para usar el chat. Serás redirigido a la página de inicio de sesión.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, authErrorMessage]);
        
        // Redirigir al login después de un breve retraso
        setTimeout(() => navigate("/auth"), 2000);
      } else {
        // Mensaje de error en caso de falla general
        const errorMessage: ChatMessage = {
          id: messages.length + 2,
          content: "Lo siento, estoy experimentando problemas para conectarme. Por favor, intenta de nuevo más tarde.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar envío con tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Mostrar pantalla de carga mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Verificando autenticación...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar mensaje de redireccionamiento
  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md p-6 text-center">
          <CardHeader>
            <Lock className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4">Acceso Restringido</CardTitle>
            <CardDescription>
              Necesitas iniciar sesión para acceder al chat con el asistente.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate("/auth")}>
              Ir a Iniciar Sesión
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl h-[80vh] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Chat con Asistente AI</CardTitle>
          <CardDescription>
            Asistente personal de calendario usando Gemini 1.5 Flash
          </CardDescription>
          <Separator />
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="flex flex-col space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <div className="flex space-x-2 items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="pt-0">
          <div className="flex w-full space-x-2">
            <Input
              placeholder="Escribe tu mensaje..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputValue.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}