import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Language } from '../types';
import { getChatResponse } from '../services/geminiService';
import { getTranslation } from '../services/translations';
import { Send, X, FileText, Sparkles, Lock } from 'lucide-react';
import { getFeatureAccessStatus, consumeFreeTrialUse } from '../services/gumroadService';

interface ChatSessionProps {
  pdfText: string;
  pdfFileName: string;
  onClose: () => void;
  lang: Language;
  isPremium?: boolean;
}

const ChatSession: React.FC<ChatSessionProps> = ({
  pdfText,
  pdfFileName,
  onClose,
  lang,
  isPremium = false,
}) => {
  const t = getTranslation(lang);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [accessStatus, setAccessStatus] = useState(getFeatureAccessStatus('chat'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const MAX_QUESTIONS = 3;
  // Verificar acceso: premium o usos gratuitos disponibles
  const hasAccess = accessStatus.isPremium || accessStatus.freeTrialUses > 0;
  const maxQuestions = hasAccess ? Infinity : MAX_QUESTIONS;

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus en el input al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Verificar acceso antes de enviar
    const currentAccess = getFeatureAccessStatus('chat');
    setAccessStatus(currentAccess);
    
    if (currentAccess.isLocked) {
      alert(t.chatLocked || 'Has agotado tus 3 usos gratuitos de Chat. ¡Actualiza a Premium para continuar!');
      return;
    }

    // Consumir un uso gratuito si no es premium
    if (!currentAccess.isPremium) {
      const useConsumed = consumeFreeTrialUse('chat');
      if (!useConsumed) {
        alert(t.chatLocked || 'Has agotado tus 3 usos gratuitos de Chat. ¡Actualiza a Premium para continuar!');
        return;
      }
      // Actualizar estado después de consumir
      setAccessStatus(getFeatureAccessStatus('chat'));
    }

    // Verificar límite de preguntas (solo para usuarios sin acceso)
    if (questionCount >= maxQuestions) {
      alert(t.chatLimitReached);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setQuestionCount((prev) => prev + 1);

    try {
      const response = await getChatResponse(pdfText, messages, userMessage.content, lang, hasAccess);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error en chat:', error);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t.chatError + ': ' + (error instanceof Error ? error.message : 'Error desconocido'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canAskMore = questionCount < maxQuestions;

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col relative">
      {/* Header */}
      <div className="bg-gray-800 border-b-4 border-indigo-500 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 border-2 border-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-200" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-400 pixel-font-header">
              {t.chatTitle}
            </h1>
            <p className="text-base text-gray-400">{pdfFileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Contador de preguntas y límite */}
          <div className="text-right">
            <div className="text-sm md:text-base text-gray-400 font-bold">
              {t.chatQuestionCount}: {questionCount}
              {!hasAccess && ` / ${MAX_QUESTIONS}`}
            </div>
            <div className="text-sm text-gray-500">
              {t.chatMaxTokens}: {hasAccess ? '100k' : '10k'} tokens
            </div>
            {accessStatus.isPremium && (
              <span className="text-sm bg-yellow-600 text-black px-3 py-1 font-bold">
                {t.chatPremium}
              </span>
            )}
            {!accessStatus.isPremium && accessStatus.freeTrialUses > 0 && (
              <span className="text-sm bg-blue-600 text-black px-3 py-1 font-bold">
                {t.chatFreeTrial || 'PRUEBA GRATIS'}: {accessStatus.freeTrialUses} usos
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-red-600 text-white border-2 border-red-500 hover:bg-red-500 transition-colors font-bold text-base"
          >
            <X className="w-5 h-5 inline mr-2" />
            {t.close}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <FileText className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <p className="text-xl md:text-2xl font-bold">{t.chatUploadPdf}</p>
            <p className="text-base md:text-lg mt-4">
              {lang === 'ES'
                ? 'Haz tu primera pregunta sobre el documento...'
                : lang === 'EN'
                ? 'Ask your first question about the document...'
                : lang === 'DE'
                ? 'Stelle deine erste Frage zum Dokument...'
                : 'Posez votre première question sur le document...'}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 border-2 ${
                message.role === 'user'
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-200'
              }`}
            >
              <div className="flex items-start gap-2 mb-3">
                {message.role === 'user' ? (
                  <span className="font-bold text-base md:text-lg">👤 {lang === 'ES' ? 'Tú' : lang === 'EN' ? 'You' : lang === 'DE' ? 'Du' : 'Vous'}</span>
                ) : (
                  <span className="font-bold text-base md:text-lg">🔮 {lang === 'ES' ? 'Espíritu' : lang === 'EN' ? 'Spirit' : lang === 'DE' ? 'Geist' : 'Esprit'}</span>
                )}
              </div>
              <div className="whitespace-pre-wrap text-base md:text-lg leading-relaxed">{message.content}</div>
              <div className="text-sm opacity-60 mt-3">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
                <span className="text-gray-400 text-base md:text-lg">{t.chatLoading}</span>
              </div>
            </div>
          </div>
        )}

        {!canAskMore && !hasAccess && (
          <div className="bg-yellow-900/50 border-4 border-yellow-600 rounded-lg p-5 text-center">
            <p className="text-yellow-200 font-bold text-base md:text-lg">{t.chatLimitReached}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area con bloqueo */}
      <div className="bg-gray-800 border-t-4 border-indigo-500 p-4">
        {accessStatus.isLocked ? (
          <div className="bg-red-900/50 border-4 border-red-600 rounded-lg p-6 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-200 font-bold text-lg md:text-xl mb-2">
              {t.chatLocked || 'Chat Bloqueado'}
            </p>
            <p className="text-red-300 text-base mb-4">
              {t.chatLockedDesc || 'Has agotado tus 3 usos gratuitos de Chat. ¡Actualiza a Premium para desbloquear esta funcionalidad!'}
            </p>
            <button
              onClick={() => {
                onClose();
                // Navegar a pricing page
                window.location.hash = 'pricing';
              }}
              className="px-6 py-3 bg-yellow-600 text-black font-bold border-2 border-yellow-500 hover:bg-yellow-500 transition-colors"
            >
              {t.pricingActivateLicense || 'ACTIVAR PREMIUM'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={canAskMore ? t.chatAskQuestion : t.chatLimitReached}
              disabled={!canAskMore || isLoading}
              className="flex-1 bg-gray-700 text-white border-2 border-gray-600 rounded px-4 py-3 font-mono text-base md:text-lg resize-none focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !canAskMore}
              className="px-8 py-4 bg-indigo-600 text-white border-2 border-indigo-500 hover:bg-indigo-500 transition-colors font-bold text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              {t.chatSend}
            </button>
          </div>
        )}
        {!canAskMore && !hasAccess && (
          <p className="text-sm md:text-base text-yellow-400 mt-3 text-center font-bold">
            {t.chatLimitReached}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatSession;

