import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Code, 
  Copy, 
  Check, 
  Image as ImageIcon,
  Clock,
  Layers
} from 'lucide-react';
import { templateApi } from '../api/client';

interface TemplatePreviewModalProps {
  templateId: string | null;
  onClose: () => void;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  templateId,
  onClose,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: previewData, isLoading, error } = useQuery({
    queryKey: ['template-preview', templateId],
    queryFn: () => templateApi.preview(templateId!),
    enabled: !!templateId,
  });

  const slides = previewData?.slides || [];
  const currentSlide = slides[currentSlideIndex];
  const totalSlides = slides.length;

  // Reset index when template changes
  useEffect(() => {
    setCurrentSlideIndex(0);
    setProgress(0);
  }, [templateId]);

  // Slideshow auto-advance and progress timer
  useEffect(() => {
    if (!isPlaying || totalSlides <= 1 || previewData?.display_mode !== 'SLIDESHOW') {
      return;
    }

    const durationSec = currentSlide?.duration_seconds || 5;
    const intervalMs = 100;
    const step = (intervalMs / (durationSec * 1000)) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          setCurrentSlideIndex((idx) => (idx + 1) % totalSlides);
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentSlideIndex, totalSlides, currentSlide?.duration_seconds, previewData?.display_mode]);

  const handlePrev = () => {
    setProgress(0);
    setCurrentSlideIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setProgress(0);
    setCurrentSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleCopyJson = () => {
    if (!previewData?.raw_json) return;
    navigator.clipboard.writeText(JSON.stringify(previewData.raw_json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!templateId) return null;

  const isFullScreen = previewData?.area === 'FULL_SCREEN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-100 text-base">
                  {previewData?.name || 'Предпросмотр шаблона'}
                </h3>
                {previewData && (
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                    v{previewData.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                <span>{isFullScreen ? 'Full Screen (1024×768 • 4:3)' : 'Mode 32 Promo (512×768 • 2:3)'}</span>
                <span>•</span>
                <span>{previewData?.display_mode}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-500">{previewData?.scene_guid}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center space-x-1.5 border ${
                showRawJson 
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showRawJson ? 'Скрыть JSON' : 'Raw JSON'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center space-y-6">
          {isLoading && (
            <div className="py-20 text-slate-400 flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Генерация предпросмотра сцены...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-sm">
              Ошибка загрузки предпросмотра шаблона
            </div>
          )}

          {previewData && !showRawJson && (
            <div className="w-full flex flex-col items-center">
              {/* POS Screen Simulation Frame */}
              <div className="relative p-3 bg-slate-950 rounded-2xl border-4 border-slate-800 shadow-2xl flex flex-col items-center">
                {/* Frame bezel top label */}
                <div className="w-full pb-2 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <span>GuestScreen 2nd Screen POS Display</span>
                  <span>{previewData.resolution}</span>
                </div>

                {/* Simulated Screen Viewport */}
                <div 
                  className={`relative overflow-hidden bg-black rounded-lg flex items-center justify-center shadow-inner ${
                    isFullScreen 
                      ? 'w-[512px] h-[384px] sm:w-[640px] sm:h-[480px]' 
                      : 'w-[280px] h-[420px] sm:w-[320px] sm:h-[480px]'
                  }`}
                >
                  {totalSlides === 0 ? (
                    <div className="text-center text-slate-600 p-6">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">В шаблоне нет слайдов</p>
                    </div>
                  ) : currentSlide?.media_type === 'VIDEO' ? (
                    <video
                      key={currentSlide.media_url}
                      src={currentSlide.media_url}
                      autoPlay
                      loop
                      muted
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      key={currentSlide?.media_url}
                      src={currentSlide?.media_url}
                      alt={currentSlide?.original_name || 'Slide'}
                      className="w-full h-full object-cover transition-opacity duration-300"
                    />
                  )}

                  {/* Slideshow Progress Bar */}
                  {previewData.display_mode === 'SLIDESHOW' && totalSlides > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 backdrop-blur-sm">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Watermark/Resolution badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/80">
                    {previewData.resolution}
                  </div>
                </div>

                {/* Slideshow Controls Bar */}
                {previewData.display_mode === 'SLIDESHOW' && totalSlides > 1 && (
                  <div className="w-full pt-3 flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePrev}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Предыдущий слайд"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                        title={isPlaying ? 'Пауза' : 'Воспроизведение'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Следующий слайд"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{currentSlide?.duration_seconds || 7} сек.</span>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {currentSlideIndex + 1} / {totalSlides}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnails list */}
              {totalSlides > 1 && (
                <div className="mt-4 flex items-center space-x-2 overflow-x-auto max-w-full pb-2">
                  {slides.map((slide: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentSlideIndex(idx);
                        setProgress(0);
                      }}
                      className={`relative rounded-lg overflow-hidden border-2 transition flex-shrink-0 w-16 h-12 bg-slate-800 ${
                        idx === currentSlideIndex 
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30' 
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={slide.media_url}
                        alt={`Slide ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono bg-black/70 px-1 rounded text-white">
                        {slide.duration_seconds}s
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Raw JSON View */}
          {showRawJson && previewData?.raw_json && (
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-mono">
                  Сформированный JSON для записи в таблицу scenes.Raw кассовой базы gs.db:
                </p>
                <button
                  onClick={handleCopyJson}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано!' : 'Копировать JSON'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px]">
                {JSON.stringify(previewData.raw_json, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Компонент сцены: {previewData?.raw_json?.name || 'N/A'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
