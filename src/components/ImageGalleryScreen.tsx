'use client';

import { useState, useEffect } from 'react';
import { Language } from '@/lib/types';
import { getTranslations } from '@/lib/translations';

interface ImageGalleryScreenProps {
  diagnosisName: string;
  diagnosisNameTranslated?: string;
  photoUrls: string[];
  videoUrl?: string;
  youtubeUrl?: string;
  language: Language;
  onClose: () => void;
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

export default function ImageGalleryScreen({
  diagnosisName,
  diagnosisNameTranslated,
  photoUrls,
  videoUrl,
  youtubeUrl,
  language,
  onClose,
}: ImageGalleryScreenProps) {
  const t = getTranslations(language);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const youtubeId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;
  const validPhotos = photoUrls.filter(Boolean);
  const hasMedia = validPhotos.length > 0 || videoUrl || youtubeUrl;

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!hasMedia) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors flex-shrink-0 shadow-lg"
          aria-label={t.goBackToExplanation}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          {t.goBack}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{diagnosisName}</p>
          {diagnosisNameTranslated && diagnosisNameTranslated !== diagnosisName && (
            <p className="text-slate-400 text-xs truncate">{diagnosisNameTranslated}</p>
          )}
        </div>
        {validPhotos.length > 1 && (
          <span className="flex-shrink-0 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
            {activePhoto + 1} / {validPhotos.length}
          </span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Photos */}
        {validPhotos.length > 0 && (
          <div className="px-3 pt-4 pb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2 px-1">
              📷 {t.illustrativeImages}
            </p>

            {/* Main photo */}
            <button
              type="button"
              onClick={() => setLightbox(validPhotos[activePhoto])}
              className="relative w-full rounded-2xl overflow-hidden bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 group"
              style={{ aspectRatio: '4/3' }}
              aria-label={t.enlarge}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={validPhotos[activePhoto]}
                alt={`${diagnosisName} ${activePhoto + 1}`}
                className="w-full h-full object-cover group-active:scale-105 transition-transform duration-200"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 right-3 bg-black/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                <span className="text-white text-xs font-medium">{t.enlarge}</span>
              </div>
            </button>

            {/* Thumbnail strip */}
            {validPhotos.length > 1 && (
              <div className="flex gap-2 mt-2.5">
                {validPhotos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`flex-1 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activePhoto ? 'border-blue-500 opacity-100' : 'border-transparent opacity-50 active:opacity-80'
                    }`}
                    style={{ aspectRatio: '4/3' }}
                    aria-label={`${t.illustrativeImages} ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`${diagnosisName} ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Local video */}
        {videoUrl && (
          <div className="px-3 pt-4 pb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2 px-1">
              🎬 {t.illustrativeVideo}
            </p>
            <div className="rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
              <video
                src={videoUrl}
                controls
                playsInline
                className="w-full h-full"
                preload="metadata"
              >
                <p className="text-white text-sm p-4">Video not supported.</p>
              </video>
            </div>
          </div>
        )}

        {/* YouTube */}
        {youtubeId && (
          <div className="px-3 pt-4 pb-2">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2 px-1">
              ▶️ {t.explanatoryVideo}
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?playsinline=1`}
                title={`Video: ${diagnosisName}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* YouTube fallback link */}
        {youtubeUrl && !youtubeId && (
          <div className="px-3 pt-4 pb-2">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-red-900/40 border border-red-800/50 rounded-2xl px-4 py-4 text-white hover:bg-red-900/60 transition-colors"
            >
              <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <div>
                <p className="font-semibold text-sm">{t.watchOnYoutube}</p>
                <p className="text-slate-400 text-xs mt-0.5">{youtubeUrl}</p>
              </div>
            </a>
          </div>
        )}

        {/* Bottom return button */}
        <div className="px-3 pt-4 pb-6">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-2xl py-4 text-base transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            {t.goBackToExplanation}
          </button>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 bg-black/40 rounded-full p-2"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt={t.enlarge}
            className="max-w-full max-h-[92vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
