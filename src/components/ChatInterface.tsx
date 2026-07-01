import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ShoppingBag, ArrowUpRight, Loader2, Sparkle } from "lucide-react";
import { Message, ShoppableItem } from "../types";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isChatLoading: boolean;
  activeStyleName: string;
}

const QUICK_REFINEMENTS = [
  "Keep this layout but make the rug blue",
  "Add a large green Monstera plant in the corner",
  "Change the lighting to warm sunset ambient",
  "Swap the coffee table for a round glass one",
];

export default function ChatInterface({
  messages,
  onSendMessage,
  isChatLoading,
  activeStyleName,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isChatLoading) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isChatLoading) return;
    onSendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl" id="chat-interface-root">
      {/* Designer Title Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Sparkle className="w-4 h-4 animate-spin-slow text-indigo-400" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></span>
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-100 font-display flex items-center gap-1.5">
              Atelier AI Designer
            </h4>
            <span className="text-[10px] text-slate-400">
              Styling consultant • Active style: <span className="text-indigo-400 font-medium">{activeStyleName}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Message Thread Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1.5 max-w-[85%] ${
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              {/* Message bubble */}
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>

              {/* Shoppable Items Drawer (Inside Assistant Message) */}
              {msg.items && msg.items.length > 0 && (
                <div className="flex flex-col gap-2 w-full mt-1.5 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold font-display text-indigo-400 uppercase tracking-wider pl-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Shoppable Matches:
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full">
                    {msg.items.map((item) => (
                      <div
                        key={item.id || item.name}
                        className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/30 p-3 rounded-xl flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-200 line-clamp-1 font-display">
                              {item.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium font-display">
                              {item.category}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans line-clamp-1">
                            {item.description}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            By <span className="text-slate-400">{item.brand}</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="text-xs font-bold text-slate-100 font-display mb-1.5">
                            {item.price}
                          </span>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md transition-colors"
                          >
                            Shop <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[9px] text-slate-500 font-mono px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Chat loading skeleton */}
        {isChatLoading && (
          <div className="flex flex-col gap-1.5 max-w-[85%] mr-auto items-start">
            <div className="p-3.5 rounded-2xl rounded-bl-none bg-slate-900 border border-slate-800 text-slate-400 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Atelier is staging your refinements and rendering details...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Refinement Suggestion Chips */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-slate-950/20 border-t border-slate-800 flex gap-2 overflow-x-auto scrollbar-none">
          {QUICK_REFINEMENTS.map((refinement, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(refinement)}
              disabled={isChatLoading}
              className="flex-shrink-0 text-xs text-slate-400 bg-slate-900 border border-slate-800 hover:border-indigo-500/30 hover:text-slate-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {refinement}
            </button>
          ))}
        </div>
      )}

      {/* Input Submit Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isChatLoading
              ? "Atelier is rendering..."
              : "Ask a design question or refine the space (e.g., 'Make the rug blue')"
          }
          disabled={isChatLoading}
          className="flex-1 px-4 py-3 rounded-xl text-sm bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isChatLoading}
          className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-colors flex items-center justify-center flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
