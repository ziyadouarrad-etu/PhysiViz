import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minus, Maximize2 } from 'lucide-react';
import { PhysicsScene } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ChatInterfaceProps {
  sceneData: PhysicsScene;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ sceneData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session when sceneData changes
  useEffect(() => {
    chatSessionRef.current = createChatSession(sceneData);
    setMessages([{ role: 'model', text: 'Hello! I see the physics problem you are looking at. Ask me anything about the forces, equations, or how to solve it!' }]);
  }, [sceneData]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
        // Use block: 'nearest' to prevent the entire chat window from shifting/scrolling
        // within its parent container, which causes the "shooting up" effect.
        (messagesEndRef.current as any).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      const text = (response as GenerateContentResponse).text;
      
      if (text) {
        setMessages(prev => [...prev, { role: 'model', text: text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error answering that. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-105 z-50 flex items-center gap-2 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-medium whitespace-nowrap">
          Ask Tutor
        </span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 w-96 h-[500px] max-h-[calc(100%-3rem)] flex flex-col bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
      {/* Header */}
      <div className="flex-none flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Physics Tutor</h3>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> Online
            </span>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-700 text-slate-200 rounded-bl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="ml-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-blue-200" {...props} />,
                        code: ({node, inline, className, children, ...props}: any) => {
                            return inline ? (
                                <code className="bg-slate-800 px-1 py-0.5 rounded text-xs font-mono text-blue-300" {...props}>{children}</code>
                            ) : (
                                <code className="block bg-slate-800 p-2 rounded text-xs font-mono text-blue-300 overflow-x-auto my-2" {...props}>{children}</code>
                            )
                        },
                        a: ({node, ...props}) => <a className="text-blue-400 underline hover:text-blue-300" target="_blank" rel="noopener noreferrer" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-500 pl-3 italic text-slate-400 my-2" {...props} />,
                    }}
                >
                    {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-none p-4 bg-slate-900 border-t border-slate-700">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput((e.target as any).value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this problem..."
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg pl-3 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-12 scrollbar-hide"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};