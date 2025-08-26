// FILE: apps/web/components/copilot/AICopilot.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopilotStore, Message } from '@/lib/store/copilotStore';

export const AICopilot = () => {
  const { sessionId, messages, addMessage, setHighlightedSelectors } = useCopilotStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const newMessage: Message = { role: 'user', content: input };
    const currentHistory = messages;

    addMessage(newMessage);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newMessage: currentInput,
          history: currentHistory,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('RECEIVED API RESPONSE:', data);
      addMessage({ role: 'assistant', content: data.text });

      // --- UPDATED: Handle multiple UI actions ---
      if (data.ui_actions && data.ui_actions.length > 0) {
        console.log(`Processing ${data.ui_actions.length} UI actions:`, data.ui_actions);
        
        // Collect all highlight selectors
        const highlightSelectors: string[] = [];
        
        data.ui_actions.forEach((action: any, index: number) => {
          if (action.action === 'highlight' && action.selector) {
            highlightSelectors.push(action.selector);
            console.log(`UI Action ${index + 1}: highlight ${action.selector}`);
          }
          // Future: handle other action types like 'scroll', 'animate', etc.
        });
        
        // Apply all highlights at once
        if (highlightSelectors.length > 0) {
          setHighlightedSelectors(highlightSelectors);
          console.log(`✅ Applied ${highlightSelectors.length} highlights simultaneously`);
        }
      }
      // --- END UPDATES ---

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({ role: 'assistant', content: `Sorry, an error occurred. ${error instanceof Error ? error.message : ''}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of component remains the same
  return (
    <div className="flex flex-col h-full bg-background-darker rounded-xl border border-border shadow-xl">
      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn("flex items-start gap-4 animate-fade-in", message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role === 'assistant' && (
              <div className="w-9 h-9 rounded-full bg-brand-primary/25 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-brand-accent" />
              </div>
            )}
            <div className={cn("max-w-[80%] p-4 rounded-xl text-base leading-relaxed", message.role === 'user' ? 'bg-brand-primary text-white ml-auto' : 'bg-background-card text-text-primary mr-auto')}>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br/>') }} />
            </div>
            {message.role === 'user' && (
              <div className="w-9 h-9 rounded-full bg-text-secondary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-text-medium" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4 justify-start animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-brand-primary/25 flex items-center justify-center flex-shrink-0">
              <Loader className="w-5 h-5 animate-spin text-brand-accent" />
            </div>
            <div className="max-w-[80%] p-4 rounded-xl bg-background-card text-text-primary mr-auto">
              <p className="text-sm animate-pulse">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Ask a question about your systems..."
            rows={3}
            className="w-full p-4 pr-16 bg-background-dark border border-border rounded-xl resize-none focus:ring-2 focus:ring-brand-accent"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || input.trim() === ''}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-brand-primary text-white hover:bg-brand-accent disabled:bg-background-secondary"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};