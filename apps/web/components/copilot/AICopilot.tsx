// apps/web/components/copilot/AICopilot.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader, User, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react'; 

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const formatBotResponse = (text: string): string => {
  let formattedText = text;

  formattedText = formattedText.replace(/^#+\s*(.*)$/gm, '$1');
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '$1');
  formattedText = formattedText.replace(/^\*\s*(.*)$/gm, '$1');
  formattedText = formattedText.replace(/^- \s*(.*)$/gm, '$1');

  formattedText = formattedText.replace(/\n\n+/g, '<p class="mb-2"></p>');
  formattedText = formattedText.replace(/\n/g, '<br/>');

  return formattedText;
};

export const AICopilot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession(); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        { id: 1, text: "Hello! I'm your NODA CoPilot. How can I help you analyze your thermal systems today?", sender: 'bot' }
      ]);
    }
  }, []); 

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    
    setMessages(prev => [...prev, userMessage]); // Add user message
    
    const currentInput = input; 
    setInput(''); 
    setIsLoading(true); // Set loading state to true

    const botPlaceholderId = Date.now() + 1;
    // --- FIX START ---
    // IMMEDIATELY add the bot placeholder message. This ensures the loader has an element to appear in.
    setMessages(prev => [...prev, { id: botPlaceholderId, text: '', sender: 'bot' }]);
    // --- FIX END ---

    try {
      const copilotStreamEndpoint = 'http://localhost:4000/api/copilot-stream'; 

      const authToken = session?.accessToken || 'fake-token'; 
      if (!authToken) {
          throw new Error("Authentication token not available.");
      }

      const response = await fetch(copilotStreamEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, 
        },
        body: JSON.stringify({ question: currentInput }), 
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null. Cannot stream data.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let accumulatedStreamText = ''; 
      let buffer = ''; 
      let done = false;
      // Removed isFirstChunk flag, as the placeholder is now always added upfront.

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone; 

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk; 

        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; 

        for (const line of lines) {
          if (line.trim() === '') continue; 

          if (line.startsWith('event: thought')) {
            try {
              const dataMatch = line.match(/data:\s*(\{.*\})/);
              if (dataMatch && dataMatch[1]) {
                const parsedData = JSON.parse(dataMatch[1]);
                console.log("CoPilot Thought:", parsedData.message); 
              }
            } catch (e) {
              console.error("Failed to parse thought event data:", line, e);
            }
          } else if (line.startsWith('event: stream')) {
            // No direct action on this line, data follows
          } else if (line.startsWith('event: done')) {
            done = true; 
            break; 
          } else if (line.startsWith('data: ')) {
            const dataString = line.substring('data: '.length); 
            try {
              const parsedData = JSON.parse(dataString);
              if (parsedData.text) {
                accumulatedStreamText += parsedData.text; 
                
                // --- FIX START ---
                // Always update the existing bot message, no need for isFirstChunk logic here.
                setMessages(prevMessages => {
                  return prevMessages.map(msg =>
                    msg.id === botPlaceholderId ? { ...msg, text: accumulatedStreamText } : msg
                  );
                });
                // --- FIX END ---
              }
            } catch (e) {
              console.error("Failed to parse data chunk JSON:", dataString, e);
            }
          }
        }
        if (done) break; 
      }

      setIsLoading(false); 

    } catch (error) {
      console.error('Error during chat stream:', error);
      setIsLoading(false);
      // --- FIX START ---
      // Ensure error message is added/updated in the placeholder if an error occurs.
      setMessages(prev => {
        // Check if the placeholder message was ever added (e.g., if fetch failed immediately)
        const hasBotPlaceholder = prev.some(msg => msg.id === botPlaceholderId);
        if (!hasBotPlaceholder) {
            // If placeholder not there, add a new message for the error
            return [...prev, {
                id: botPlaceholderId, // Use the same ID for consistency
                text: `Error: Failed to get response. ${error instanceof Error ? error.message : String(error)}. Check console.`,
                sender: 'bot'
            }];
        }
        // If placeholder is there, update its text to the error message
        return prev.map(msg =>
            msg.id === botPlaceholderId ? {
                ...msg,
                text: `Error: Failed to get response. ${error instanceof Error ? error.message : String(error)}. Check console.`,
                sender: 'bot'
            } : msg
        );
      });
      // --- FIX END ---
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); 
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-darker rounded-xl border border-border shadow-xl">
      
      {/* Message Area */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar"> 
        {messages.map((message, index) => ( 
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-4 animate-fade-in",
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.sender === 'bot' && (
              <div className="w-9 h-9 rounded-full bg-brand-primary/25 flex items-center justify-center flex-shrink-0"> 
                {/* Display loader ONLY for the last bot message if isLoading is true */}
                {isLoading && index === messages.length - 1 ? (
                  <Loader className="w-5 h-5 animate-spin text-brand-accent" />
                ) : (
                  <Bot className="w-5 h-5 text-brand-accent" />
                )}
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] p-4 rounded-xl text-base leading-relaxed",
                message.sender === 'user'
                  ? 'bg-brand-primary text-white ml-auto'
                  : 'bg-background-card text-text-primary mr-auto'
              )}
            >
              <p 
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: formatBotResponse(message.text) }} 
              />
            </div>
            {message.sender === 'user' && (
              <div className="w-9 h-9 rounded-full bg-text-secondary/20 flex items-center justify-center flex-shrink-0"> 
                <User className="w-5 h-5 text-text-medium" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your systems..."
            rows={3}
            className="w-full p-4 pr-16 bg-background-dark border border-border rounded-xl text-text-primary resize-none focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all duration-200 text-base"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || input.trim() === ''}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent disabled:bg-background-secondary disabled:text-text-secondary disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};