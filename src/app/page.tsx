'use client';

import { useState, useEffect, useCallback } from 'react';
import { Language, AnalysisResult, DoctorConfig, DoctorDiagnosisConfig, ColonSegment, Finding } from '@/lib/types';
import { getTranslations } from '@/lib/translations';
import LanguageSelector from '@/components/LanguageSelector';
import ImageCapture from '@/components/ImageCapture';
import ColonDiagram from '@/components/ColonDiagram';
import FindingCard from '@/components/FindingCard';
import TTSButton from '@/components/TTSButton';

const inputUiText: Record<Language, {
  uploadHint: string;
  fileMode: string;
  textMode: string;
  textLabel: string;
  textPlaceholder: string;
  textHelp: string;
  readinessTitle: string;
  readinessItems: string[];
  consent: string;
  textTooShort: string;
  consentRequired: string;
}> = {
  es: {
    uploadHint: 'Sube una foto, adjunta un PDF o pega el texto del informe.',
    fileMode: 'Archivo o cámara',
    textMode: 'Pegar texto',
    textLabel: 'Texto del informe',
    textPlaceholder: 'Pega aquí el informe de colonoscopia, incluyendo hallazgos, localización y recomendaciones si aparecen.',
    textHelp: 'Recomendado: incluye el texto completo para que la explicación sea más precisa.',
    readinessTitle: 'Antes de analizar',
    readinessItems: ['Texto legible y sin cortes', 'Sin sombras ni reflejos', 'Informe completo si es PDF', 'Idioma elegido correcto'],
    consent: 'Entiendo que esta herramienta ofrece información orientativa, no sustituye la consulta médica, y autorizo el procesamiento del informe para generar la explicación.',
    textTooShort: 'Pega al menos unas líneas del informe para poder analizarlo.',
    consentRequired: 'Confirma primero el consentimiento informativo y de privacidad.',
  },
  en: {
    uploadHint: 'Upload a photo, attach a PDF, or paste the report text.',
    fileMode: 'File or camera',
    textMode: 'Paste text',
    textLabel: 'Report text',
    textPlaceholder: 'Paste the colonoscopy report here, including findings, location and recommendations if available.',
    textHelp: 'Recommended: include the full text so the explanation is more accurate.',
    readinessTitle: 'Before analyzing',
    readinessItems: ['Readable text without cuts', 'No shadows or glare', 'Complete report if PDF', 'Correct language selected'],
    consent: 'I understand this tool provides informational guidance, does not replace medical consultation, and I authorize processing the report to generate the explanation.',
    textTooShort: 'Paste at least a few lines of the report before analyzing.',
    consentRequired: 'Please confirm the informational and privacy consent first.',
  },
  fr: {
    uploadHint: 'Téléchargez une photo, joignez un PDF ou collez le texte du rapport.',
    fileMode: 'Fichier ou caméra',
    textMode: 'Coller le texte',
    textLabel: 'Texte du rapport',
    textPlaceholder: 'Collez ici le rapport de coloscopie, avec les résultats, la localisation et les recommandations si disponibles.',
    textHelp: 'Recommandé : incluez le texte complet pour une explication plus précise.',
    readinessTitle: 'Avant l’analyse',
    readinessItems: ['Texte lisible et complet', 'Sans ombres ni reflets', 'Rapport complet si PDF', 'Langue correcte sélectionnée'],
    consent: 'Je comprends que cet outil fournit une information indicative, ne remplace pas la consultation médicale, et j’autorise le traitement du rapport pour générer l’explication.',
    textTooShort: 'Collez au moins quelques lignes du rapport pour pouvoir l’analyser.',
    consentRequired: 'Veuillez d’abord confirmer le consentement informatif et de confidentialité.',
  },
  it: {
    uploadHint: 'Carica una foto, allega un PDF o incolla il testo del referto.',
    fileMode: 'File o fotocamera',
    textMode: 'Incolla testo',
    textLabel: 'Testo del referto',
    textPlaceholder: 'Incolla qui il referto di colonscopia, inclusi reperti, localizzazione e raccomandazioni se presenti.',
    textHelp: 'Consigliato: includi il testo completo per una spiegazione più precisa.',
    readinessTitle: 'Prima di analizzare',
    readinessItems: ['Testo leggibile e completo', 'Senza ombre o riflessi', 'Referto completo se PDF', 'Lingua corretta selezionata'],
    consent: 'Comprendo che questo strumento offre informazioni orientative, non sostituisce la visita medica, e autorizzo il trattamento del referto per generare la spiegazione.',
    textTooShort: 'Incolla almeno alcune righe del referto per poterlo analizzare.',
    consentRequired: 'Conferma prima il consenso informativo e privacy.',
  },
  pt: {
    uploadHint: 'Carregue uma foto, anexe um PDF ou cole o texto do relatório.',
    fileMode: 'Ficheiro ou câmara',
    textMode: 'Colar texto',
    textLabel: 'Texto do relatório',
    textPlaceholder: 'Cole aqui o relatório de colonoscopia, incluindo achados, localização e recomendações se existirem.',
    textHelp: 'Recomendado: inclua o texto completo para uma explicação mais precisa.',
    readinessTitle: 'Antes de analisar',
    readinessItems: ['Texto legível e sem cortes', 'Sem sombras nem reflexos', 'Relatório completo se PDF', 'Idioma correto selecionado'],
    consent: 'Compreendo que esta ferramenta oferece informação orientativa, não substitui a consulta médica, e autorizo o processamento do relatório para gerar a explicação.',
    textTooShort: 'Cole pelo menos algumas linhas do relatório antes de analisar.',
    consentRequired: 'Confirme primeiro o consentimento informativo e de privacidade.',
  },
  de: {
    uploadHint: 'Laden Sie ein Foto hoch, fügen Sie eine PDF an oder fügen Sie den Berichtstext ein.',
    fileMode: 'Datei oder Kamera',
    textMode: 'Text einfügen',
    textLabel: 'Berichtstext',
    textPlaceholder: 'Fügen Sie hier den Koloskopiebericht ein, einschließlich Befunden, Lokalisation und Empfehlungen, falls vorhanden.',
    textHelp: 'Empfohlen: vollständigen Text einfügen, damit die Erklärung genauer wird.',
    readinessTitle: 'Vor der Analyse',
    readinessItems: ['Text lesbar und vollständig', 'Keine Schatten oder Reflexe', 'Vollständiger Bericht bei PDF', 'Richtige Sprache ausgewählt'],
    consent: 'Ich verstehe, dass dieses Tool nur orientierende Informationen bietet, keine ärztliche Beratung ersetzt, und ich erlaube die Verarbeitung des Berichts zur Erstellung der Erklärung.',
    textTooShort: 'Fügen Sie mindestens einige Zeilen des Berichts ein.',
    consentRequired: 'Bitte bestätigen Sie zuerst die Informations- und Datenschutzeinwilligung.',
  },
  nl: {
    uploadHint: 'Upload een foto, voeg een PDF toe of plak de tekst van het rapport.',
    fileMode: 'Bestand of camera',
    textMode: 'Tekst plakken',
    textLabel: 'Rapporttekst',
    textPlaceholder: 'Plak hier het coloscopierapport, inclusief bevindingen, locatie en aanbevelingen indien beschikbaar.',
    textHelp: 'Aanbevolen: voeg de volledige tekst toe voor een nauwkeurigere uitleg.',
    readinessTitle: 'Voor analyse',
    readinessItems: ['Leesbare tekst zonder afsnijding', 'Geen schaduw of reflectie', 'Volledig rapport bij PDF', 'Juiste taal geselecteerd'],
    consent: 'Ik begrijp dat dit hulpmiddel informatief is, geen medisch consult vervangt, en ik geef toestemming om het rapport te verwerken voor de uitleg.',
    textTooShort: 'Plak minstens enkele regels van het rapport om te analyseren.',
    consentRequired: 'Bevestig eerst de informatie- en privacytoestemming.',
  },
  pl: {
    uploadHint: 'Prześlij zdjęcie, dołącz PDF albo wklej tekst raportu.',
    fileMode: 'Plik lub aparat',
    textMode: 'Wklej tekst',
    textLabel: 'Tekst raportu',
    textPlaceholder: 'Wklej tutaj raport z kolonoskopii, w tym wyniki, lokalizację i zalecenia, jeśli są dostępne.',
    textHelp: 'Zalecane: wklej pełny tekst, aby wyjaśnienie było dokładniejsze.',
    readinessTitle: 'Przed analizą',
    readinessItems: ['Czytelny tekst bez ucięć', 'Bez cieni i odblasków', 'Pełny raport, jeśli PDF', 'Wybrano właściwy język'],
    consent: 'Rozumiem, że narzędzie ma charakter informacyjny, nie zastępuje konsultacji lekarskiej i wyrażam zgodę na przetwarzanie raportu w celu wygenerowania wyjaśnienia.',
    textTooShort: 'Wklej przynajmniej kilka wierszy raportu.',
    consentRequired: 'Najpierw potwierdź zgodę informacyjną i prywatności.',
  },
  ro: {
    uploadHint: 'Încărcați o fotografie, atașați un PDF sau lipiți textul raportului.',
    fileMode: 'Fișier sau cameră',
    textMode: 'Lipiți text',
    textLabel: 'Textul raportului',
    textPlaceholder: 'Lipiți aici raportul de colonoscopie, inclusiv constatările, localizarea și recomandările dacă apar.',
    textHelp: 'Recomandat: includeți textul complet pentru o explicație mai precisă.',
    readinessTitle: 'Înainte de analiză',
    readinessItems: ['Text lizibil și complet', 'Fără umbre sau reflexii', 'Raport complet dacă este PDF', 'Limba corectă selectată'],
    consent: 'Înțeleg că acest instrument oferă informații orientative, nu înlocuiește consultația medicală și autorizez procesarea raportului pentru generarea explicației.',
    textTooShort: 'Lipiți cel puțin câteva rânduri din raport.',
    consentRequired: 'Confirmați mai întâi consimțământul informativ și de confidențialitate.',
  },
  ar: {
    uploadHint: 'ارفع صورة، أو أرفق ملف PDF، أو الصق نص التقرير.',
    fileMode: 'ملف أو كاميرا',
    textMode: 'لصق النص',
    textLabel: 'نص التقرير',
    textPlaceholder: 'الصق هنا تقرير تنظير القولون، بما في ذلك النتائج والموقع والتوصيات إن وجدت.',
    textHelp: 'يُفضل إدخال النص الكامل للحصول على شرح أدق.',
    readinessTitle: 'قبل التحليل',
    readinessItems: ['النص واضح وغير مقطوع', 'بدون ظلال أو انعكاسات', 'التقرير كامل إذا كان PDF', 'اللغة المختارة صحيحة'],
    consent: 'أفهم أن هذه الأداة تقدم معلومات إرشادية ولا تغني عن استشارة الطبيب، وأوافق على معالجة التقرير لإنشاء الشرح.',
    textTooShort: 'الصق بضعة أسطر على الأقل من التقرير قبل التحليل.',
    consentRequired: 'يرجى تأكيد الموافقة المعلوماتية والخصوصية أولاً.',
  },
  ru: {
    uploadHint: 'Загрузите фото, прикрепите PDF или вставьте текст отчёта.',
    fileMode: 'Файл или камера',
    textMode: 'Вставить текст',
    textLabel: 'Текст отчёта',
    textPlaceholder: 'Вставьте сюда отчёт колоноскопии, включая находки, локализацию и рекомендации, если они есть.',
    textHelp: 'Рекомендуется вставить полный текст для более точного объяснения.',
    readinessTitle: 'Перед анализом',
    readinessItems: ['Текст читаемый и полный', 'Без теней и бликов', 'Полный отчёт, если PDF', 'Выбран правильный язык'],
    consent: 'Я понимаю, что инструмент предоставляет справочную информацию, не заменяет консультацию врача, и разрешаю обработку отчёта для создания объяснения.',
    textTooShort: 'Вставьте хотя бы несколько строк отчёта.',
    consentRequired: 'Сначала подтвердите информационное согласие и согласие на обработку.',
  },
  zh: {
    uploadHint: '上传照片、附加 PDF，或粘贴报告文本。',
    fileMode: '文件或相机',
    textMode: '粘贴文本',
    textLabel: '报告文本',
    textPlaceholder: '在此粘贴结肠镜报告，包括发现、部位和建议（如有）。',
    textHelp: '建议粘贴完整文本，以获得更准确的解释。',
    readinessTitle: '分析前',
    readinessItems: ['文字清晰且完整', '无阴影或反光', 'PDF 报告完整', '已选择正确语言'],
    consent: '我理解此工具仅提供信息参考，不能替代医生咨询，并同意处理报告以生成解释。',
    textTooShort: '请至少粘贴几行报告文本。',
    consentRequired: '请先确认信息和隐私同意。',
  },
};

/** Try to match a finding to a doctor-configured diagnosis entry */
function findDoctorDiagConfig(finding: Finding, config: DoctorConfig): DoctorDiagnosisConfig | null {
  // 1. Exact match on overall_finding_type
  if (finding.overall_finding_type && config[finding.overall_finding_type]) {
    return config[finding.overall_finding_type];
  }
  // 2. Try case-insensitive partial match of medical_name against config keys
  const nameLower = finding.medical_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [key, value] of Object.entries(config)) {
    const keyNorm = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (nameLower.includes(keyNorm) || keyNorm.includes(nameLower)) {
      return value;
    }
  }
  // 3. Try matching translated name
  if (finding.medical_name_translated) {
    const transLower = finding.medical_name_translated.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, value] of Object.entries(config)) {
      const keyNorm = key.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (transLower.includes(keyNorm) || keyNorm.includes(transLower)) {
        return value;
      }
    }
  }
  return null;
}

export default function HomePage() {
  const [language, setLanguage]             = useState<Language>('es');
  const [selectedImage, setSelectedImage]   = useState<string | null>(null);
  const [manualReportText, setManualReportText] = useState('');
  const [inputMode, setInputMode]           = useState<'file' | 'text'>('file');
  const [hasConsent, setHasConsent]         = useState(false);
  const [isAnalyzing, setIsAnalyzing]       = useState(false);
  const [result, setResult]                 = useState<AnalysisResult | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [doctorConfig, setDoctorConfig]     = useState<DoctorConfig>({});
  const [highlightedFinding, setHighlightedFinding] = useState<string | null>(null);
  const [diagramOpen, setDiagramOpen]       = useState(false);
  const [isDark, setIsDark]                 = useState(true);

  const t = getTranslations(language);
  const inputText = inputUiText[language] ?? inputUiText.es;
  const isRtl = language === 'ar';

  // Sync theme from DOM on mount (the layout script may have already applied it)
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    try { localStorage.setItem('colonreport-theme', newDark ? 'dark' : 'light'); } catch {}
  };

  // Always fetch from API
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === 'object' && !data.error) setDoctorConfig(data); })
      .catch(() => {});
  }, []);

  const handleImageSelected = useCallback((base64: string) => {
    setSelectedImage(base64); setResult(null); setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    const reportText = manualReportText.trim();
    if (inputMode === 'file' && !selectedImage) return;
    if (inputMode === 'text' && reportText.length < 30) {
      setError(inputText.textTooShort);
      return;
    }
    if (!hasConsent) {
      setError(inputText.consentRequired);
      return;
    }
    setIsAnalyzing(true); setError(null); setResult(null);
    try {
      const res  = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: inputMode === 'file' ? selectedImage : undefined,
          reportText: inputMode === 'text' ? reportText : undefined,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || t.errorAnalysis); }
      else {
        setResult(data as AnalysisResult);
        setDiagramOpen(false);
        setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 200);
      }
    } catch { setError(t.errorAnalysis); }
    finally   { setIsAnalyzing(false); }
  }, [selectedImage, manualReportText, inputMode, hasConsent, language, t.errorAnalysis, inputText.consentRequired, inputText.textTooShort]);

  const handleNewAnalysis = () => {
    setResult(null); setSelectedImage(null); setError(null);
    setManualReportText(''); setHasConsent(false);
    setHighlightedFinding(null); setDiagramOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const findingsBySegment: Record<ColonSegment, string[]> = {
    terminal_ileum: [], cecum: [], ascending_colon: [], hepatic_flexure: [],
    transverse_colon: [], splenic_flexure: [], descending_colon: [],
    sigmoid_colon: [], rectum: [], anal_canal: [], multiple: [], unspecified: [],
  };
  if (result) {
    for (const f of result.findings) {
      if (f.location && findingsBySegment[f.location] !== undefined)
        findingsBySegment[f.location].push(f.medical_name);
    }
  }
  const highlightedSegments: ColonSegment[] = result
    ? [...new Set(result.findings.map((f) => f.location).filter((l) => l !== 'multiple' && l !== 'unspecified'))]
    : [];

  const allFindingsText = result
    ? result.findings.map((f) => `${f.medical_name}. ${f.explanation.what_is} ${f.explanation.implications} ${f.explanation.follow_up}`).join('. ')
    : '';

  return (
    <div className="min-h-screen flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Brand row */}
        <div className="max-w-2xl md:max-w-5xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900 flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-blue-900 dark:text-blue-300 leading-tight truncate" style={{ fontFamily: 'var(--font-playfair, serif)' }}>
                ColonReport
              </h1>
              <a href="https://endoscopianardulli.es" target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 leading-tight block truncate">
                endoscopianardulli.es
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Dark/light toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
            >
              {isDark ? (
                /* Sun icon */
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                /* Moon icon */
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Admin link — desktop only */}
            <a href="/admin"
              className="hidden md:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-lg px-2.5 py-1.5 transition-all"
              title="Panel médico">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Panel médico
            </a>
          </div>
        </div>

        {/* Language strip */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-1.5 overflow-x-auto">
          <div className="max-w-2xl md:max-w-5xl mx-auto">
            <LanguageSelector current={language} onChange={setLanguage} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl md:max-w-5xl mx-auto w-full px-3 md:px-6 py-5 md:py-8 flex flex-col gap-5">

        {/* ── Hero (upload screen) ───────────────────────────────── */}
        {!result && (
          <>
            <section className="text-center pt-2 pb-1 md:pt-8 md:pb-4">
              <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800 mb-3">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Dr. Nardulli · endoscopianardulli.es
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 leading-tight" style={{ fontFamily: 'var(--font-playfair, serif)' }}>
                {t.heroTitle}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-sm md:max-w-xl mx-auto leading-relaxed">{t.heroSubtitle}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {[{ icon: '🔬', label: t.featureAI }, { icon: '🌍', label: t.featureLanguages }, { icon: '🔊', label: t.featureVoice }].map(({ icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span>{icon}</span><span>{label}</span>
                  </span>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3 md:max-w-2xl md:mx-auto md:w-full">
              <div className="glass-card p-4">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-0.5" style={{ fontFamily: 'var(--font-playfair, serif)' }}>
                  {t.uploadTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{inputText.uploadHint}</p>

                <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-slate-900/70 p-1 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('file');
                      setError(null);
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${inputMode === 'file' ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {inputText.fileMode}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('text');
                      setError(null);
                    }}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${inputMode === 'text' ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {inputText.textMode}
                  </button>
                </div>

                {inputMode === 'file' ? (
                  <ImageCapture onImageSelected={(b64) => handleImageSelected(b64)} language={language} />
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200" htmlFor="manual-report">
                      {inputText.textLabel}
                    </label>
                    <textarea
                      id="manual-report"
                      value={manualReportText}
                      onChange={(event) => {
                        setManualReportText(event.target.value);
                        setResult(null);
                        setError(null);
                      }}
                      rows={10}
                      placeholder={inputText.textPlaceholder}
                      className="mt-2 w-full resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 px-3 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{inputText.textHelp}</p>
                  </div>
                )}

                <div className="mt-3 rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 p-4">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{inputText.readinessTitle}</p>
                  <ul className="mt-2 grid gap-1.5 text-sm text-blue-900/80 dark:text-blue-100/80 sm:grid-cols-2">
                    {inputText.readinessItems.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(event) => setHasConsent(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                  />
                  <span>{inputText.consent}</span>
                </label>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !hasConsent || (inputMode === 'file' ? !selectedImage : manualReportText.trim().length < 30)}
                className="btn-primary w-full justify-center text-base py-4 pulse-blue disabled:pulse-none disabled:opacity-50">
                {isAnalyzing ? (
                  <><span className="spinner" />{t.analyzing}</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>{t.analyzeBtn}</>
                )}
              </button>

              {error && (
                <div className="glass-card p-4 border border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-950/40 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-red-700 dark:text-red-300 font-medium text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-500 dark:text-red-400 text-xs mt-1 underline">{t.tryAgain}</button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Results ────────────────────────────────────────────── */}
        {result && (
          <section id="results-section" className="flex flex-col gap-4">

            {/* Top bar */}
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-playfair, serif)' }}>
                {t.findingsTitle}
              </h2>
              <button onClick={handleNewAnalysis} className="btn-secondary py-2 px-3 text-sm flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t.newAnalysis}
              </button>
            </div>

            {/* Overall summary */}
            <div className="glass-card p-4 border-l-4 border-blue-500">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">{t.overallSummary}</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{result.overall_summary}</p>
                  {result.report_date && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t.reportDate}: {result.report_date}
                    </p>
                  )}
                </div>
                <TTSButton text={result.overall_summary} language={language} />
              </div>
            </div>

            {/* Collapsible colon diagram */}
            <div className="glass-card overflow-hidden">
              <button
                onClick={() => setDiagramOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.colonMapTitle}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">({highlightedSegments.length} {highlightedSegments.length !== 1 ? t.segments : t.segment})</span>
                </div>
                <svg className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${diagramOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {diagramOpen && (
                <div className="px-2 pb-3">
                  <ColonDiagram
                    highlightedSegments={highlightedSegments}
                    language={language}
                    findingsBySegment={findingsBySegment}
                    onSegmentClick={(seg) => {
                      const finding = result.findings.find((f) => f.location === seg);
                      if (finding) {
                        setHighlightedFinding(finding.id);
                        setDiagramOpen(false);
                        setTimeout(() => document.getElementById(`finding-${finding.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Finding cards */}
            {result.findings.length === 0 ? (
              <div className="glass-card p-8 text-center text-slate-500 dark:text-slate-400">
                <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{t.noFindings}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.findings.map((finding, index) => (
                    <div key={finding.id} id={`finding-${finding.id}`}>
                      <FindingCard
                        finding={finding}
                        doctorConfig={findDoctorDiagConfig(finding, doctorConfig)}
                        language={language}
                        index={index}
                        isHighlighted={highlightedFinding === finding.id}
                      />
                    </div>
                  ))}
                </div>

                {/* Listen all */}
                <div className="glass-card p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{t.listenAll}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{result.findings.length} {language === 'es' ? (result.findings.length === 1 ? 'hallazgo' : 'hallazgos') : (result.findings.length === 1 ? 'finding' : 'findings')}</p>
                  </div>
                  <TTSButton text={allFindingsText} language={language} label={t.listenAll} />
                </div>

                <button onClick={handleNewAnalysis} className="btn-primary w-full justify-center py-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t.newAnalysis}
                </button>
              </>
            )}
          </section>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm px-4 py-5 text-center space-y-1">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dr. Gianfranco Nardulli Fernández · Gastroenterólogo</p>
        <a href="https://endoscopianardulli.es" target="_blank" rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors block">
          endoscopianardulli.es
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-500">© 2025 · {t.poweredBy}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">{t.disclaimer}</p>
        <a href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mt-1 transition-colors">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Panel médico
        </a>
      </footer>
    </div>
  );
}
