
import React, { useState, useRef, useEffect } from 'react';
import { generateThinkingResponse } from '../services/geminiService';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, userRole }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: `Willkommen im DSB Strategie-Assistenten. Ich nutze Gemini 3 Pro mit erweitertem Denkmodus, um komplexe pädagogische oder administrative Fragen zu beantworten. Wie kann ich Ihnen als ${userRole} heute helfen?` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const context = `Der Benutzer ist als ${userRole} im DSB Brooklyn Schulmanagementsystem angemeldet. Antworten Sie präzise und strategisch. Nutzen Sie Ihren Denkmodus, um fundierte pädagogische oder organisatorische Ratschläge zu geben.`;
    const aiResponse = await generateThinkingResponse(userMsg, context);
    
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse || 'Entschuldigung, ich konnte keine Antwort generieren.' }]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-slate-900 shadow-[0_0_100px_rgba(0,0,0,0.2)] z-[200] flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-500 ease-out">
      <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-[#1e3a8a] text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-pulse">
            🧠
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tighter text-xl leading-none">AI Consultant</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Thinking Mode Enabled (Gemini 3 Pro)</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors font-black text-xl"
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-6 rounded-[32px] text-sm font-bold leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'
            }`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[32px] rounded-tl-none flex items-center gap-3 border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-bounce"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Complex Analysis in progress...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
        <div className="relative">
          <textarea 
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Fragen Sie nach pädagogischen Strategien oder Datenanalysen..."
            className="w-full p-6 pr-16 bg-slate-50 dark:bg-slate-800 rounded-3xl text-sm font-bold outline-none border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 transition-all dark:text-white resize-none"
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            className="absolute right-4 bottom-4 p-4 bg-indigo-600 text-white rounded-2xl font-black transition-all active:scale-90 shadow-xl shadow-indigo-100 dark:shadow-none disabled:opacity-50 disabled:grayscale"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-widest mt-4 opacity-50">
          Experten-Modus aktiv: Der Assistent denkt bis zu 30 Sekunden nach.
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
