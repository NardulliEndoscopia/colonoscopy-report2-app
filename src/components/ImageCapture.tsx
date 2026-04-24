'use client';

import { useState, useRef, useCallback } from 'react';
import { Language } from '@/lib/types';
import { getTranslations } from '@/lib/translations';
import Image from 'next/image';

interface ImageCaptureProps {
  onImageSelected: (base64: string, file: File) => void;
  language: Language;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const uiText: Record<Language, {
  helper: string;
  unsupported: string;
  tooLarge: string;
  fileReady: string;
  selectedFile: string;
}> = {
  es: { helper: 'PDF, JPG, PNG, WebP o HEIC - max. 20 MB', unsupported: 'Formato no compatible. Usa PDF, JPG, PNG, WebP o HEIC.', tooLarge: 'El archivo supera 20 MB. Prueba con una foto comprimida o un PDF mas pequeno.', fileReady: 'Archivo listo', selectedFile: 'Archivo seleccionado' },
  en: { helper: 'PDF, JPG, PNG, WebP or HEIC - max. 20 MB', unsupported: 'Unsupported format. Use PDF, JPG, PNG, WebP or HEIC.', tooLarge: 'The file is larger than 20 MB. Try a compressed photo or a smaller PDF.', fileReady: 'File ready', selectedFile: 'Selected file' },
  fr: { helper: 'PDF, JPG, PNG, WebP ou HEIC - max. 20 Mo', unsupported: 'Format non compatible. Utilisez PDF, JPG, PNG, WebP ou HEIC.', tooLarge: 'Le fichier depasse 20 Mo. Essayez une photo compressee ou un PDF plus petit.', fileReady: 'Fichier pret', selectedFile: 'Fichier selectionne' },
  it: { helper: 'PDF, JPG, PNG, WebP o HEIC - max. 20 MB', unsupported: 'Formato non supportato. Usa PDF, JPG, PNG, WebP o HEIC.', tooLarge: 'Il file supera 20 MB. Prova con una foto compressa o un PDF piu piccolo.', fileReady: 'File pronto', selectedFile: 'File selezionato' },
  pt: { helper: 'PDF, JPG, PNG, WebP ou HEIC - max. 20 MB', unsupported: 'Formato nao suportado. Use PDF, JPG, PNG, WebP ou HEIC.', tooLarge: 'O ficheiro excede 20 MB. Tente uma foto comprimida ou um PDF menor.', fileReady: 'Ficheiro pronto', selectedFile: 'Ficheiro selecionado' },
  de: { helper: 'PDF, JPG, PNG, WebP oder HEIC - max. 20 MB', unsupported: 'Nicht unterstuetztes Format. Nutzen Sie PDF, JPG, PNG, WebP oder HEIC.', tooLarge: 'Die Datei ist groesser als 20 MB. Versuchen Sie ein komprimiertes Foto oder eine kleinere PDF.', fileReady: 'Datei bereit', selectedFile: 'Datei ausgewaehlt' },
  nl: { helper: 'PDF, JPG, PNG, WebP of HEIC - max. 20 MB', unsupported: 'Niet-ondersteund formaat. Gebruik PDF, JPG, PNG, WebP of HEIC.', tooLarge: 'Het bestand is groter dan 20 MB. Probeer een gecomprimeerde foto of kleinere PDF.', fileReady: 'Bestand klaar', selectedFile: 'Bestand geselecteerd' },
  pl: { helper: 'PDF, JPG, PNG, WebP lub HEIC - maks. 20 MB', unsupported: 'Nieobsługiwany format. Uzyj PDF, JPG, PNG, WebP lub HEIC.', tooLarge: 'Plik przekracza 20 MB. Uzyj skompresowanego zdjecia lub mniejszego PDF.', fileReady: 'Plik gotowy', selectedFile: 'Wybrany plik' },
  ro: { helper: 'PDF, JPG, PNG, WebP sau HEIC - max. 20 MB', unsupported: 'Format neacceptat. Folositi PDF, JPG, PNG, WebP sau HEIC.', tooLarge: 'Fisierul depaseste 20 MB. Incercati o poza comprimata sau un PDF mai mic.', fileReady: 'Fisier pregatit', selectedFile: 'Fisier selectat' },
  ar: { helper: 'PDF أو JPG أو PNG أو WebP أو HEIC - حتى 20 MB', unsupported: 'تنسيق غير مدعوم. استخدم PDF أو JPG أو PNG أو WebP أو HEIC.', tooLarge: 'حجم الملف أكبر من 20 MB. جرّب صورة مضغوطة أو PDF أصغر.', fileReady: 'الملف جاهز', selectedFile: 'تم اختيار الملف' },
  ru: { helper: 'PDF, JPG, PNG, WebP или HEIC - до 20 MB', unsupported: 'Формат не поддерживается. Используйте PDF, JPG, PNG, WebP или HEIC.', tooLarge: 'Файл больше 20 MB. Попробуйте сжатое фото или PDF меньшего размера.', fileReady: 'Файл готов', selectedFile: 'Файл выбран' },
  zh: { helper: 'PDF、JPG、PNG、WebP 或 HEIC - 最大 20 MB', unsupported: '格式不支持。请使用 PDF、JPG、PNG、WebP 或 HEIC。', tooLarge: '文件超过 20 MB。请尝试压缩照片或较小的 PDF。', fileReady: '文件已就绪', selectedFile: '已选择文件' },
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function ImageCapture({ onImageSelected, language }: ImageCaptureProps) {
  const t = getTranslations(language);
  const labels = uiText[language] ?? uiText.es;
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    const isAccepted = ACCEPTED_FILE_TYPES.includes(file.type) || file.type.startsWith('image/');
    if (!isAccepted) {
      setFileError(labels.unsupported);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError(labels.tooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      setFileName(file.name || labels.selectedFile);
      setFileSize(formatFileSize(file.size));
      setFileType(file.type);
      setFileError(null);
      onImageSelected(dataUrl, file);
    };
    reader.readAsDataURL(file);
  }, [labels.selectedFile, labels.tooLarge, labels.unsupported, onImageSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const resetSelection = () => {
    setPreview(null);
    setFileName('');
    setFileSize('');
    setFileType('');
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const isRtl = language === 'ar';
  const isPdf = fileType === 'application/pdf';

  if (preview) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 flex flex-col items-center gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          {isPdf ? (
            <div className="aspect-[4/3] flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 3h7l5 5v13H7V3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 3v5h5M9 15h6M9 18h4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 break-all">{fileName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF · {fileSize}</p>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={preview}
                alt={t.imageSelected}
                width={480}
                height={360}
                className="w-full object-contain max-h-72"
                unoptimized
              />
              <div className="absolute top-2 right-2">
                <span className="bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                  {t.imageSelected}
                </span>
              </div>
            </>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center break-all">
          {labels.fileReady}: {fileName} · {fileSize}
        </p>
        <button onClick={resetSelection} className="btn-secondary text-sm py-2 px-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0119 5" />
          </svg>
          {t.changeImage}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 flex flex-col gap-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3
          cursor-pointer transition-all duration-200 min-h-[180px]
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
          }
        `}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${isDragging ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
          <svg className={`w-7 h-7 ${isDragging ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        </div>
        <div className="text-center">
          <p className={`text-sm font-medium ${isDragging ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
            {t.dragDrop}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{labels.helper}</p>
        </div>
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-blue-500/10 border-2 border-blue-500 pointer-events-none" />
        )}
      </div>

      {fileError && (
        <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">
          {fileError}
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      <div className="flex gap-3 flex-col sm:flex-row">
        <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex-1 justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {t.uploadBtn}
        </button>
        <button onClick={() => cameraInputRef.current?.click()} className="btn-secondary flex-1 justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t.cameraBtn}
        </button>
      </div>
    </div>
  );
}
