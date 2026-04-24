'use client';

import { Language } from '@/lib/types';

interface LanguageSelectorProps {
  current: Language;
  onChange: (lang: Language) => void;
}

const languages: { code: Language; flag: string; name: string }[] = [
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
  { code: 'ro', flag: '🇷🇴', name: 'Română' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
];

export default function LanguageSelector({ current, onChange }: LanguageSelectorProps) {
  return (
    /* Horizontal scroll strip — single row on all screen sizes */
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      {languages.map(({ code, flag, name }) => (
        <button
          key={code}
          onClick={() => onChange(code)}
          title={name}
          aria-label={name}
          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border
            ${current === code
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
              : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500'
            }`}
        >
          <span className="text-sm leading-none">{flag}</span>
          <span className="hidden sm:inline whitespace-nowrap">{name}</span>
        </button>
      ))}
    </div>
  );
}
