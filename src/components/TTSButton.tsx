'use client';

import { useCallback, useEffect, useState } from 'react';
import { Language } from '@/lib/types';

interface TTSButtonProps {
  text: string;
  language: Language;
  className?: string;
  label?: string;
}

const speechLang: Record<Language, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  it: 'it-IT',
  pt: 'pt-PT',
  de: 'de-DE',
  nl: 'nl-NL',
  pl: 'pl-PL',
  ro: 'ro-RO',
  ar: 'ar-SA',
  ru: 'ru-RU',
  zh: 'zh-CN',
};

export default function TTSButton({ text, language, className = '', label }: TTSButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => stop, [stop]);

  const handleClick = useCallback(() => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      stop();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang[language] ?? 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, language, stop, text]);

  return (
    <button
      onClick={handleClick}
      title={isSpeaking ? 'Detener narracion' : (label || 'Escuchar')}
      aria-label={isSpeaking ? 'Detener narracion' : (label || 'Escuchar')}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isSpeaking
          ? 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <rect x="3" y="4" width="3" height="12" rx="1.5" />
            <rect x="8.5" y="2" width="3" height="16" rx="1.5" />
            <rect x="14" y="5" width="3" height="10" rx="1.5" />
          </svg>
          <span>{label ? 'Detener' : '●'}</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .893.165 1.747.466 2.52.111.29.39.48.701.48h1.535l4.033 3.796A.75.75 0 0010 16.25V3.75zM15.95 5.05a.75.75 0 00-1.06 1.061 5.5 5.5 0 010 7.778.75.75 0 001.06 1.06 7 7 0 000-9.899z" />
            <path d="M13.829 7.172a.75.75 0 00-1.061 1.06 2.5 2.5 0 010 3.536.75.75 0 001.06 1.06 4 4 0 000-5.656z" />
          </svg>
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
