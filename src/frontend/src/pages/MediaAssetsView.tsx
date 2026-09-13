import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Image as ImageIcon, 
  Film, 
  UploadCloud, 
  Trash2, 
  Search, 
  Copy, 
  Check, 
  Eye, 
  X, 
  Layers, 
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { mediaApi, MediaAsset, MediaUsageResponse } from '../api/client';

const MediaCardThumbnail: React.FC<{
  asset: MediaAsset;
  onPreview: () => void;
}> = ({ asset, onPreview }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isVideo = asset.media_type === 'VIDEO';
  const isFull = asset.width === 1024 && asset.height === 768;
  const isPromo = asset.width === 512 && asset.height === 768;

  return (
    <div
      onClick={onPreview}
      className="aspect-[4/3] bg-[#171821] rounded-xl overflow-hidden relative cursor-pointer flex items-center justify-center mb-2.5 border border-[#2C2D3A] hover:border-[#A9DFD8] transition-all select-none group"
    >
      {isVideo ? (
        <div className="flex flex-col items-center justify-center text-[#87888C] p-2">
          <div className="w-10 h-10 rounded-full bg-[#21222D] text-[#A9DFD8] border border-[#2C2D3A] flex items-center justify-center mb-1.5 shadow-sm">
            <Film className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold text-gray-300">MP4 VIDEO</span>
        </div>
      ) : hasError ? (
        <div className="flex flex-col items-center justify-center text-[#737791] p-2 text-center">
          <ImageIcon className="w-7 h-7 text-[#737791] mb-1" />
          <span className="text-[9px] text-[#87888C] font-medium">Ошибка загрузки</span>
        </div>
      ) : (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-[#171821] animate-pulse flex items-center justify-center z-10">
              <Loader2 className="w-4 h-4 text-[#737791] animate-spin" />
            </div>
          )}
          <img
            src={mediaApi.getThumbnailUrl(asset.id)}
            alt={asset.original_name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => {
              setHasError(true);
              setLoaded(true);
            }}
          />
        </>
      )}

      {/* Aspect Ratio Badge */}
      <div className="absolute top-2 left-2 flex gap-1 z-20 pointer-events-none">
        {isFull && (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-[#05C168] text-[#171821] shadow-sm">
            FULL 4:3
          </span>
        )}
        {isPromo && (
          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-[#A9DFD8] text-[#171821] shadow-sm">
            50/50 2:3
          </span>
        )}
      </div>
    </div>
  );
};

export const MediaAssetsView: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'FULL' | 'PROMO'>('ALL');
  const [previewMedia, setPreviewMedia] = useState<MediaAsset | null>(null);
  const [mediaUsage, setMediaUsage] = useState<MediaUsageResponse | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessCount, setUploadSuccessCount] = useState<number | null>(null);

  // Load Media Assets from FastAPI GET /api/v1/media
  const { data: mediaList = [], isLoading, refetch } = useQuery({
    queryKey: ['media-assets'],
    queryFn: () => mediaApi.list(),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => mediaApi.delete(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setPreviewMedia(null);
      setMediaUsage(null);
    },
    onError: (err: any) => {
      alert(`Ошибка удаления файла: ${err.message}`);
    }
  });

  // Batch Upload Handler
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccessCount(null);

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await mediaApi.upload(file);
        successCount++;
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || 'Ошибка загрузки'}`);
      }
    }

    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ['media-assets'] });

    if (errors.length > 0) {
      setUploadError(`Загружено: ${successCount}. Ошибок: ${errors.length}. ${errors.slice(0, 2).join('; ')}`);
    } else {
      setUploadSuccessCount(successCount);
      setTimeout(() => setUploadSuccessCount(null), 6000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Inspect Usage when opening modal
  const handleOpenPreview = async (asset: MediaAsset) => {
    setPreviewMedia(asset);
    setMediaUsage(null);
    try {
      const usage = await mediaApi.getUsage(asset.id);
      setMediaUsage(usage);
    } catch {
      // ignore
    }
  };

  // Filtered Assets
  const filteredMedia = mediaList.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !m.original_name.toLowerCase().includes(q) && !m.sha256.toLowerCase().includes(q)) {
      return false;
    }
    if (filterType === 'IMAGE' && m.media_type !== 'IMAGE') return false;
    if (filterType === 'VIDEO' && m.media_type !== 'VIDEO') return false;
    if (filterType === 'FULL') {
      const ratio = m.width && m.height ? m.width / m.height : 0;
      return ratio >= 1.25 && ratio <= 1.4;
    }
    if (filterType === 'PROMO') {
      const ratio = m.width && m.height ? m.width / m.height : 0;
      return ratio <= 0.85;
    }
    return true;
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Медиатека</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#21222D] text-[#A9DFD8] border border-[#2C2D3A]">
              {mediaList.length} файлов
            </span>
          </div>
          <p className="text-xs text-[#87888C] mt-1">
            Хранилище рекламных баннеров и видеороликов, валидация разрешений (1024×768, 512×768) и контроль SHA-256
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFilesSelected}
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] shadow-lg shadow-[#A9DFD8]/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#171821]" />
                <span>Загрузка файлов...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Загрузить медиа</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Alerts */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-[#FF5B5B]/15 border border-[#FF5B5B]/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#FF5B5B] flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-[#87888C] hover:text-white">✕</button>
        </div>
      )}

      {uploadSuccessCount !== null && (
        <div className="p-4 rounded-xl bg-[#05C168]/15 border border-[#05C168]/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#05C168]" />
            <span>Успешно загружено файлов: {uploadSuccessCount}. SHA-256 хеши проверены и зарегистрированы в библиотеке.</span>
          </div>
          <button onClick={() => setUploadSuccessCount(null)} className="text-[#87888C] hover:text-white">✕</button>
        </div>
      )}

      {/* Toolbar: Search and Filter Tabs */}
      <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737791]" />
          <input
            type="text"
            placeholder="Поиск по названию файла или SHA-256..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8] transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center bg-[#171821] p-1 rounded-xl text-xs overflow-x-auto border border-[#2C2D3A]">
          {[
            { id: 'ALL', label: 'Все файлы' },
            { id: 'IMAGE', label: 'Изображения' },
            { id: 'VIDEO', label: 'Видео' },
            { id: 'FULL', label: 'FULL SCREEN (4:3)' },
            { id: 'PROMO', label: '50/50 PROMO (2:3)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                filterType === tab.id 
                  ? 'bg-[#A9DFD8] text-[#171821] font-bold shadow-sm' 
                  : 'text-[#87888C] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-[#737791] text-xs">
          Загрузка медиатеки...
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-12 text-center shadow-xl">
          <ImageIcon className="w-12 h-12 text-[#737791] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white mb-1">Медиафайлы не найдены</h3>
          <p className="text-xs text-[#87888C] max-w-sm mx-auto mb-4">
            {searchQuery 
              ? 'По вашему запросу ничего не найдено.' 
              : 'В медиатеке пока нет файлов. Нажмите "Загрузить медиа", чтобы добавить изображения или видео.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((m) => {
            return (
              <div 
                key={m.id}
                className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-3 flex flex-col justify-between hover:border-[#A9DFD8]/50 hover:shadow-xl transition-all group"
              >
                <div>
                  <MediaCardThumbnail asset={m} onPreview={() => handleOpenPreview(m)} />

                  {/* Title & Info */}
                  <h4 
                    onClick={() => handleOpenPreview(m)}
                    className="font-bold text-white text-xs truncate hover:text-[#A9DFD8] cursor-pointer"
                    title={m.original_name}
                  >
                    {m.original_name}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-[#87888C] font-mono mt-1">
                    <span>{m.width}×{m.height}</span>
                    <span>{formatFileSize(m.file_size_bytes ?? m.size_bytes)}</span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="pt-2.5 mt-2.5 border-t border-[#2C2D3A]/60 flex items-center justify-between">
                  <span className="text-[9px] text-[#737791] font-mono truncate max-w-[80px]" title={m.sha256}>
                    {m.sha256.substring(0, 8)}...
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenPreview(m)}
                      className="p-1.5 text-[#87888C] hover:text-[#A9DFD8] hover:bg-[#171821] rounded-lg transition-colors"
                      title="Просмотр"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Удалить файл "${m.original_name}" из медиатеки?`)) {
                          deleteMutation.mutate({ id: m.id });
                        }
                      }}
                      className="p-1.5 text-[#737791] hover:text-[#FF5B5B] hover:bg-[#FF5B5B]/15 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Media Detail & Inspection Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="p-4 border-b border-[#2C2D3A] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm truncate max-w-md">
                {previewMedia.original_name}
              </h3>
              <button 
                onClick={() => { setPreviewMedia(null); setMediaUsage(null); }}
                className="text-[#87888C] hover:text-white p-1 rounded-lg hover:bg-[#171821]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Media Preview Box */}
              <div className="w-full min-h-56 max-h-80 bg-[#171821] rounded-xl border border-[#2C2D3A] overflow-hidden flex items-center justify-center relative">
                {previewMedia.media_type === 'VIDEO' ? (
                  <video 
                    src={mediaApi.getFileUrl(previewMedia.id)}
                    controls
                    preload="metadata"
                    className="max-h-80 max-w-full"
                  />
                ) : (
                  <img
                    src={mediaApi.getFileUrl(previewMedia.id)}
                    alt={previewMedia.original_name}
                    className="max-h-80 max-w-full object-contain"
                  />
                )}
              </div>

              {/* Technical Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#171821] p-2.5 rounded-xl border border-[#2C2D3A]">
                  <span className="text-[#87888C] text-[10px] block font-medium">Разрешение</span>
                  <span className="text-white font-mono font-bold text-xs">{previewMedia.width} × {previewMedia.height}</span>
                </div>
                <div className="bg-[#171821] p-2.5 rounded-xl border border-[#2C2D3A]">
                  <span className="text-[#87888C] text-[10px] block font-medium">Размер файла</span>
                  <span className="text-white font-mono font-bold text-xs">{formatFileSize(previewMedia.file_size_bytes ?? previewMedia.size_bytes)}</span>
                </div>
                <div className="bg-[#171821] p-2.5 rounded-xl border border-[#2C2D3A]">
                  <span className="text-[#87888C] text-[10px] block font-medium">MIME-тип</span>
                  <span className="text-gray-300 font-mono text-xs">{previewMedia.mime_type}</span>
                </div>
                <div className="bg-[#171821] p-2.5 rounded-xl border border-[#2C2D3A]">
                  <span className="text-[#87888C] text-[10px] block font-medium">Используется</span>
                  <span className="text-[#A9DFD8] font-bold text-xs font-mono">
                    {mediaUsage ? `${mediaUsage.usage_count} блоков` : 'Загрузка...'}
                  </span>
                </div>
              </div>

              {/* SHA-256 Checksum Card */}
              <div className="bg-[#171821] p-3 rounded-xl border border-[#2C2D3A] space-y-1">
                <span className="text-[#87888C] text-[11px] block font-medium">Контрольная сумма SHA-256:</span>
                <div className="flex items-center justify-between">
                  <code className="text-[#A9DFD8] font-mono text-[11px] break-all select-all">
                    {previewMedia.sha256}
                  </code>
                  <button
                    onClick={() => copyHash(previewMedia.sha256)}
                    className="p-1.5 bg-[#21222D] border border-[#2C2D3A] hover:bg-[#282A37] rounded-lg text-gray-300 flex items-center space-x-1 ml-2 flex-shrink-0"
                  >
                    {copiedHash === previewMedia.sha256 ? <Check className="w-3.5 h-3.5 text-[#05C168]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Template Usage List */}
              {mediaUsage && mediaUsage.templates.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-white block">Рекламные шаблоны, использующие этот файл:</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {mediaUsage.templates.map((tmpl) => (
                      <div key={tmpl.id} className="p-2 bg-[#171821] border border-[#2C2D3A] rounded-lg flex items-center justify-between">
                        <span className="font-medium text-white">{tmpl.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21222D] text-[#87888C] border border-[#2C2D3A]">{tmpl.area}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#A9DFD8]/20 text-[#A9DFD8] font-semibold">{tmpl.display_mode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-[#2C2D3A] bg-[#1A1C26] flex items-center justify-between">
              <button
                onClick={() => {
                  if (window.confirm(`Удалить файл "${previewMedia.original_name}"?`)) {
                    deleteMutation.mutate({ id: previewMedia.id });
                  }
                }}
                className="px-4 py-2 rounded-xl text-[#FF5B5B] hover:bg-[#FF5B5B]/15 font-semibold border border-[#FF5B5B]/30 transition-colors"
              >
                Удалить файл
              </button>

              <button
                onClick={() => { setPreviewMedia(null); setMediaUsage(null); }}
                className="px-5 py-2 rounded-xl text-white font-semibold bg-[#171821] border border-[#2C2D3A] hover:bg-[#282A37] transition-colors"
              >
                Закрыть
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
