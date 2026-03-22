import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import { Bot, Send, User, Loader2, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AIAssistant = () => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      role: 'assistant',
      content: t('aiWelcome')
    }]);
    
    // Generate session ID
    setSessionId(`chat_${Date.now()}`);
  }, [language]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage,
          session_id: sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        if (data.session_id) setSessionId(data.session_id);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: language === 'es' 
            ? 'Lo siento, hubo un error. Por favor intenta de nuevo.' 
            : 'Sorry, there was an error. Please try again.'
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: language === 'es' 
          ? 'Error de conexión. Por favor verifica tu internet.' 
          : 'Connection error. Please check your internet.'
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const quickPrompts = language === 'es' ? [
    '¿Cuántas mascotas hay registradas?',
    '¿Hay vacunas por vencer pronto?',
    '¿Qué productos tienen stock bajo?',
    '¿Cuántas facturas están pendientes?'
  ] : [
    'How many pets are registered?',
    'Are there any vaccines expiring soon?',
    'Which products have low stock?',
    'How many invoices are pending?'
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in" data-testid="ai-assistant-page">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white font-['Manrope'] flex items-center gap-2">
          <Bot className="w-7 h-7 text-orange-500" />
          {t('aiAssistant')}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {language === 'es' 
            ? 'Tu copiloto inteligente para gestionar la clínica' 
            : 'Your intelligent copilot for clinic management'}
        </p>
      </div>

      {/* Chat Container */}
      <Card className="card-surface flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${index}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-orange-500" />
                    </div>
                  )}
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-zinc-800 text-zinc-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-zinc-300" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="bg-zinc-800 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                      <span className="text-sm text-zinc-400">
                        {language === 'es' ? 'Pensando...' : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 border-t border-zinc-800">
              <div className="max-w-3xl mx-auto">
                <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {language === 'es' ? 'Prueba preguntar:' : 'Try asking:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                      className="text-xs bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:text-orange-400"
                      data-testid={`quick-prompt-${i}`}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
            <div className="max-w-3xl mx-auto flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('askAnything')}
                className="flex-1 input-field"
                disabled={loading}
                data-testid="chat-input"
              />
              <Button 
                type="submit" 
                className="btn-primary px-4"
                disabled={!input.trim() || loading}
                data-testid="send-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
