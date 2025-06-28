"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader, User, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export const AICopilot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Add a welcome message when the component loads
  useEffect(() => {
    setMessages([
      { id: 1, text: "Hello! I'm your NODA CoPilot. How can I help you analyze your thermal systems today?", sender: 'bot' }
    ]);
  }, []);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // --- Placeholder for AI response ---
    // In the future, this is where we will call our AI endpoint.
    // For now, we'll just simulate a response after a short delay.
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: "This is a placeholder response. The AI endpoint is not yet connected.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center gap-3">
        <Bot className="text-brand-accent w-6 h-6" />
        <h2 className="font-heading text-xl font-bold text-text-light">NODA CoPilot</h2>
      </div>

      {/* Message Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3 animate-fade-in",
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-brand-accent" />
              </div>
            )}
            <div
              className={cn(
                "max-w-md p-3 rounded-lg",
                message.sender === 'user'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-700/50 text-text-light'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
            </div>
             {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-text-medium" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-brand-accent" />
            </div>
            <div className="max-w-md p-3 rounded-lg bg-gray-700/50 text-text-light">
               <Loader className="w-5 h-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your systems..."
            className="w-full h-24 p-3 pr-20 bg-background-dark border border-gray-700 rounded-md text-text-light resize-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || input.trim() === ''}
            className="absolute bottom-3 right-3 p-2 rounded-md bg-brand-primary text-white hover:bg-brand-accent disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
