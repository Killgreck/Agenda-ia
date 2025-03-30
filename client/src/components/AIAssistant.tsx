import { useState, useRef, useEffect } from "react";
import { Bot, Send, Mic, Clock, CalendarDays, HelpCircle, User } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/useTaskManager";

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, isTyping } = useAI();
  
  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessage(message);
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
        <p className="text-sm text-gray-500 mt-1">Powered by Deepsek</p>
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
