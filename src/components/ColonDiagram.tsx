'use client';

import { useState } from 'react';
import { ColonSegment, Language } from '@/lib/types';
import { getTranslations } from '@/lib/translations';

interface ColonDiagramProps {
  highlightedSegments: ColonSegment[];
  language: Language;
  findingsBySegment: Record<ColonSegment, string[]>;
  onSegmentClick?: (segment: ColonSegment) => void;
}

type AnatomicalSegment = Exclude<ColonSegment, 'multiple' | 'unspecified'>;

const allSegments: AnatomicalSegment[] = [
  'terminal_ileum',
  'cecum',
  'ascending_colon',
  'hepatic_flexure',
  'transverse_colon',
  'splenic_flexure',
  'descending_colon',
  'sigmoid_colon',
  'rectum',
  'anal_canal',
];

const segmentPaths: Record<AnatomicalSegment, string> = {
  terminal_ileum: 'M 74 370 C 46 360 34 337 48 320 C 63 301 92 308 105 334',
  cecum: 'M 103 329 C 74 337 61 366 72 392 C 84 420 124 426 143 402 C 160 379 147 343 119 331',
  ascending_colon: 'M 116 333 C 92 282 94 221 105 166 C 113 129 129 99 155 82',
  hepatic_flexure: 'M 155 82 C 178 61 219 56 247 72',
  transverse_colon: 'M 247 72 C 293 96 345 96 389 72',
  splenic_flexure: 'M 389 72 C 421 57 459 73 469 106',
  descending_colon: 'M 469 106 C 483 158 476 226 460 281 C 450 319 438 348 420 372',
  sigmoid_colon: 'M 420 372 C 386 411 325 392 328 349 C 331 309 390 317 383 361 C 376 410 302 423 282 462',
  rectum: 'M 282 462 C 270 491 270 523 281 552',
  anal_canal: 'M 281 552 C 286 564 296 570 308 570',
};

const labelPositions: Record<AnatomicalSegment, { x: number; y: number; anchor: 'start' | 'middle' | 'end' }> = {
  terminal_ileum: { x: 64, y: 300, anchor: 'middle' },
  cecum: { x: 98, y: 435, anchor: 'middle' },
  ascending_colon: { x: 55, y: 222, anchor: 'start' },
  hepatic_flexure: { x: 160, y: 43, anchor: 'middle' },
  transverse_colon: { x: 318, y: 45, anchor: 'middle' },
  splenic_flexure: { x: 477, y: 64, anchor: 'middle' },
  descending_colon: { x: 514, y: 232, anchor: 'end' },
  sigmoid_colon: { x: 384, y: 432, anchor: 'middle' },
  rectum: { x: 250, y: 517, anchor: 'end' },
  anal_canal: { x: 324, y: 590, anchor: 'middle' },
};

const markerPositions: Record<AnatomicalSegment, { x: number; y: number }> = {
  terminal_ileum: { x: 68, y: 340 },
  cecum: { x: 108, y: 385 },
  ascending_colon: { x: 116, y: 225 },
  hepatic_flexure: { x: 186, y: 80 },
  transverse_colon: { x: 318, y: 82 },
  splenic_flexure: { x: 442, y: 95 },
  descending_colon: { x: 465, y: 230 },
  sigmoid_colon: { x: 374, y: 365 },
  rectum: { x: 282, y: 510 },
  anal_canal: { x: 300, y: 560 },
};

const uiText: Record<Language, { normal: string; withFinding: string; number: string; empty: string; tap: string }> = {
  es: { normal: 'Sin hallazgos', withFinding: 'Con hallazgo', number: 'Nº hallazgo', empty: 'No hay hallazgos en este segmento', tap: 'Toca un segmento resaltado para ver su tarjeta' },
  en: { normal: 'No findings', withFinding: 'With finding', number: 'Finding #', empty: 'No findings in this segment', tap: 'Tap a highlighted segment to view its card' },
  fr: { normal: 'Sans résultat', withFinding: 'Avec résultat', number: 'Nº résultat', empty: 'Aucun résultat dans ce segment', tap: 'Touchez un segment surligné pour voir sa carte' },
  it: { normal: 'Senza reperti', withFinding: 'Con reperto', number: 'Nº reperto', empty: 'Nessun reperto in questo segmento', tap: 'Tocca un segmento evidenziato per vedere la scheda' },
  pt: { normal: 'Sem achados', withFinding: 'Com achado', number: 'Nº achado', empty: 'Sem achados neste segmento', tap: 'Toque num segmento destacado para ver o cartão' },
  de: { normal: 'Ohne Befund', withFinding: 'Mit Befund', number: 'Befund-Nr.', empty: 'Keine Befunde in diesem Segment', tap: 'Tippen Sie auf ein markiertes Segment, um die Karte zu sehen' },
  nl: { normal: 'Geen bevindingen', withFinding: 'Met bevinding', number: 'Bevinding #', empty: 'Geen bevindingen in dit segment', tap: 'Tik op een gemarkeerd segment om de kaart te bekijken' },
  pl: { normal: 'Bez zmian', withFinding: 'Ze znaleziskiem', number: 'Nr znaleziska', empty: 'Brak znalezisk w tym odcinku', tap: 'Dotknij podświetlonego odcinka, aby zobaczyć kartę' },
  ro: { normal: 'Fără constatări', withFinding: 'Cu constatare', number: 'Nr. constatare', empty: 'Nu există constatări în acest segment', tap: 'Atingeți un segment evidențiat pentru a vedea cardul' },
  ar: { normal: 'بدون نتائج', withFinding: 'مع نتيجة', number: 'رقم النتيجة', empty: 'لا توجد نتائج في هذا الجزء', tap: 'اضغط على الجزء المحدد لعرض البطاقة' },
  ru: { normal: 'Без находок', withFinding: 'Есть находка', number: '№ находки', empty: 'В этом сегменте находок нет', tap: 'Нажмите на выделенный сегмент, чтобы открыть карточку' },
  zh: { normal: '无发现', withFinding: '有发现', number: '发现编号', empty: '此段无发现', tap: '点击高亮肠段查看卡片' },
};

function segmentTone(isHighlighted: boolean, isHovered: boolean, hasFindings: boolean) {
  if (isHighlighted) {
    return { outer: '#1d4ed8', body: '#60a5fa', inner: '#dbeafe', width: 44, opacity: 1 };
  }
  if (isHovered || hasFindings) {
    return { outer: '#2563eb', body: '#93c5fd', inner: '#eff6ff', width: 42, opacity: 1 };
  }
  return { outer: '#fb7185', body: '#fecdd3', inner: '#fff1f2', width: 39, opacity: 0.95 };
}

export default function ColonDiagram({
  highlightedSegments,
  language,
  findingsBySegment,
  onSegmentClick,
}: ColonDiagramProps) {
  const t = getTranslations(language);
  const labels = uiText[language] ?? uiText.es;
  const [hoveredSegment, setHoveredSegment] = useState<ColonSegment | null>(null);

  const segmentsWithFindings = allSegments.filter((seg) => findingsBySegment[seg]?.length > 0);
  const findingIndexMap: Partial<Record<ColonSegment, number>> = {};
  segmentsWithFindings.forEach((seg, i) => {
    findingIndexMap[seg] = i + 1;
  });

  const activeSegment = hoveredSegment ?? segmentsWithFindings[0] ?? null;
  const activeFindings = activeSegment ? findingsBySegment[activeSegment] ?? [] : [];

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="section-title text-lg">{t.colonDiagramTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{labels.tap}</p>
        </div>
        {segmentsWithFindings.length > 0 && (
          <span className="rounded-full bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
            {segmentsWithFindings.length}
          </span>
        )}
      </div>

      <div className="relative w-full max-w-sm mx-auto">
        <svg viewBox="0 0 560 620" className="w-full h-auto" role="img" aria-label={t.colonDiagramTitle}>
          <defs>
            <linearGradient id="colonBg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f8fbff" />
              <stop offset="100%" stopColor="#eef6ff" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
            <filter id="segmentGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.45" />
            </filter>
          </defs>

          <rect width="560" height="620" rx="28" fill="url(#colonBg)" />
          <ellipse cx="280" cy="318" rx="170" ry="230" fill="#ffffff" opacity="0.55" />
          <path
            d="M 198 151 C 252 126 343 127 404 158 C 465 190 495 255 482 337 C 471 407 419 452 350 467 C 292 480 214 465 160 415 C 108 367 91 291 113 224 C 126 185 153 164 198 151 Z"
            fill="#fff7f7"
            opacity="0.55"
          />

          <g filter="url(#softShadow)">
            {allSegments.map((seg) => {
              const isHighlighted = highlightedSegments.includes(seg);
              const isHovered = hoveredSegment === seg;
              const hasFindings = findingsBySegment[seg]?.length > 0;
              const tone = segmentTone(isHighlighted, isHovered, hasFindings);

              return (
                <g key={seg}>
                  <path
                    d={segmentPaths[seg]}
                    fill="none"
                    stroke={tone.outer}
                    strokeWidth={tone.width + 8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={tone.opacity}
                    filter={isHighlighted ? 'url(#segmentGlow)' : undefined}
                  />
                  <path
                    d={segmentPaths[seg]}
                    fill="none"
                    stroke={tone.body}
                    strokeWidth={tone.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={tone.opacity}
                  />
                  <path
                    d={segmentPaths[seg]}
                    fill="none"
                    stroke={tone.inner}
                    strokeWidth={Math.max(12, tone.width - 22)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                  <path
                    d={segmentPaths[seg]}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={tone.width + 24}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
                    onMouseEnter={() => setHoveredSegment(seg)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onFocus={() => setHoveredSegment(seg)}
                    onBlur={() => setHoveredSegment(null)}
                    onClick={() => onSegmentClick?.(seg)}
                    tabIndex={onSegmentClick ? 0 : -1}
                    role="button"
                    aria-label={`${t.colonSegments[seg]}: ${findingsBySegment[seg]?.join(', ') || labels.empty}`}
                  />
                </g>
              );
            })}
          </g>

          <path d="M 135 407 C 149 435 178 452 213 449" fill="none" stroke="#fda4af" strokeWidth={8} strokeLinecap="round" opacity={0.65} />
          <path d="M 235 118 C 273 105 326 107 364 121" fill="none" stroke="#fda4af" strokeWidth={7} strokeLinecap="round" opacity={0.55} />

          {allSegments.map((seg) => {
            const position = labelPositions[seg];
            const hasFindings = findingsBySegment[seg]?.length > 0;
            const isActive = hoveredSegment === seg || highlightedSegments.includes(seg);

            return (
              <text
                key={`label-${seg}`}
                x={position.x}
                y={position.y}
                textAnchor={position.anchor}
                fontSize={isActive ? 12 : 10}
                fontWeight={hasFindings || isActive ? 700 : 500}
                fill={hasFindings || isActive ? '#1d4ed8' : '#475569'}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {t.colonSegments[seg]}
              </text>
            );
          })}

          {segmentsWithFindings.map((seg) => {
            const position = markerPositions[seg];
            const num = findingIndexMap[seg];
            const isActive = hoveredSegment === seg || highlightedSegments.includes(seg);

            return (
              <g key={`marker-${seg}`} style={{ pointerEvents: 'none' }}>
                <circle cx={position.x} cy={position.y} r={isActive ? 15 : 13} fill="#1d4ed8" stroke="#ffffff" strokeWidth={3} />
                <text
                  x={position.x}
                  y={position.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#ffffff"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                >
                  {num}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-200 border border-rose-300" />
          <span>{labels.normal}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-400 border border-blue-600" />
          <span>{labels.withFinding}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-700 text-white text-[10px] font-bold flex items-center justify-center">1</span>
          <span>{labels.number}</span>
        </div>
      </div>

      {activeSegment && (
        <div className="rounded-xl border border-blue-100 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-blue-800 dark:text-blue-300">{t.colonSegments[activeSegment]}: </span>
          {activeFindings.length > 0 ? activeFindings.join(', ') : labels.empty}
        </div>
      )}
    </div>
  );
}
