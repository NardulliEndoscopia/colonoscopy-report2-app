'use client';

import { useEffect, useRef, useState } from 'react';
import { Finding, DoctorDiagnosisConfig, Language } from '@/lib/types';
import { getTranslations } from '@/lib/translations';
import TTSButton from './TTSButton';
import ImageGalleryScreen from './ImageGalleryScreen';

interface FindingCardProps {
  finding: Finding;
  doctorConfig: DoctorDiagnosisConfig | null;
  language: Language;
  index: number;
  isHighlighted?: boolean;
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ── FindingCard ──────────────────────────────────────────────────── */
export default function FindingCard({ finding, doctorConfig, language, index, isHighlighted = false }: FindingCardProps) {
  const t       = getTranslations(language);
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible,     setVisible]     = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const isRtl = language === 'ar';

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const explanation = finding.explanation;
  const ttsName     = finding.medical_name_translated || finding.medical_name;
  const fullText    = [ttsName, `${t.whatIs}: ${explanation.what_is}`, `${t.implications}: ${explanation.implications}`, `${t.followUp}: ${explanation.follow_up}`].join('. ');
  const locationLabel = t.colonSegments[finding.location as keyof typeof t.colonSegments] || finding.location;

  const photoUrls  = (doctorConfig?.photo_urls ?? []).filter((u): u is string => !!u);
  const videoUrl   = doctorConfig?.video_url   || '';
  const youtubeUrl = doctorConfig?.youtube_url || '';
  const youtubeId  = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;
  const hasMedia   = photoUrls.length > 0 || videoUrl || youtubeUrl;

  return (
    <div
      ref={cardRef}
      className={`glass-card overflow-hidden transition-all duration-300 ${isHighlighted ? 'ring-2 ring-blue-400 shadow-blue-100 dark:shadow-blue-900/40' : ''} ${visible ? 'finding-card-enter' : 'opacity-0 translate-y-6'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* ── Card header ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200 dark:shadow-blue-900">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-snug" style={{ fontFamily: 'var(--font-playfair, serif)' }}>
            {finding.medical_name}
            {finding.medical_name_translated && finding.medical_name_translated !== finding.medical_name && (
              <span className="text-slate-400 dark:text-slate-500 font-normal text-base"> / {finding.medical_name_translated}</span>
            )}
          </h3>
          <span className="inline-flex items-center gap-1 mt-1 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {t.location}: {locationLabel}
          </span>
        </div>
      </div>

      {/* ── Explanation ────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-xl p-3.5 border border-blue-100/60 dark:border-blue-800/40">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">🔬</span>
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t.whatIs}</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{explanation.what_is}</p>
        </div>
        <div className="bg-amber-50/70 dark:bg-amber-950/40 rounded-xl p-3.5 border border-amber-100/60 dark:border-amber-800/40">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">💡</span>
            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t.implications}</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{explanation.implications}</p>
        </div>
        <div className="bg-green-50/70 dark:bg-green-950/40 rounded-xl p-3.5 border border-green-100/60 dark:border-green-800/40">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">📋</span>
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">{t.followUp}</h4>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{explanation.follow_up}</p>
        </div>
      </div>

      {/* ── Ver imágenes button (opens fullscreen modal) ───────── */}
      {hasMedia && (
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={() => setGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 active:from-blue-800 active:to-blue-900 text-white font-semibold rounded-2xl py-3.5 text-sm transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/40 active:scale-[0.98]"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Ver imágenes y videos de ejemplo
          </button>
        </div>
      )}

      {/* ── TTS footer ─────────────────────────────────────────── */}
      <div className="px-4 pb-4 pt-1 flex justify-end">
        <TTSButton text={fullText} language={language} label={t.listenThis} />
      </div>

      {/* ── Image Gallery Modal (fullscreen) ─────────────────────── */}
      {galleryOpen && (
        <ImageGalleryScreen
          diagnosisName={finding.medical_name}
          diagnosisNameTranslated={finding.medical_name_translated}
          photoUrls={photoUrls}
          videoUrl={videoUrl}
          youtubeUrl={youtubeUrl}
          language={language}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
