import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  Clock, 
  GripVertical, 
  Eye, 
  RefreshCw, 
  CheckCircle2,
  Video as VideoIcon,
  Image as ImageIcon,
  Layers,
  Info
} from 'lucide-react';
import { apiRequest, templateApi, mediaApi, ApiError } from '../api/client';
import { TemplatePreviewModal } from '../components/TemplatePreviewModal';

interface PlaylistItemState {
  media_asset_id: string;
  duration_seconds: number;
}

export const AdvertisingBlockEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<'FULL_SCREEN' | 'MODE32_PROMO'>('FULL_SCREEN');
  const [displayMode, setDisplayMode] = useState<'STATIC' | 'SLIDESHOW' | 'VIDEO'>('STATIC');
  const [selectedItems, setSelectedItems] = useState<PlaylistItemState[]>([]);
  const [version, setVersion] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [occConflictModalOpen, setOccConflictModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Drag and drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Load available media
  const { data: mediaAssets } = useQuery({
    queryKey: ['media-assets'],
    queryFn: () => mediaApi.list(),
  });

  // Load existing block if editing
  const { data: existingBlock, isLoading: loadingBlock, refetch: refetchBlock } = useQuery({
    queryKey: ['advertising-block', id],
    queryFn: () => templateApi.get(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingBlock) {
      setName(existingBlock.name || '');
      setDescription(existingBlock.description || '');
      setArea(existingBlock.area || 'FULL_SCREEN');
      setDisplayMode(existingBlock.display_mode || 'STATIC');
      setVersion(existingBlock.version ?? 1);

      if (existingBlock.items && Array.isArray(existingBlock.items)) {
        const sortedItems = [...existingBlock.items]
          .sort((a, b) => a.order_index - b.order_index)
          .map((it) => ({
            media_asset_id: it.media_asset_id,
            duration_seconds: it.duration_seconds || 7,
          }));
        setSelectedItems(sortedItems);
      }
    }
  }, [existingBlock]);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const copyList = [...selectedItems];
      const draggedItemContent = copyList[dragItem.current];
      copyList.splice(dragItem.current, 1);
      copyList.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setSelectedItems(copyList);
    }
  };

  const handleAddItem = (asset: any) => {
    setWarningMsg(null);

    // Rule: SLIDESHOW allows images only (no video)
    if (displayMode === 'SLIDESHOW' && asset.media_type === 'VIDEO') {
      setWarningMsg('В режиме «Слайдшоу» поддерживаются только изображения (JPEG/PNG/WebP). Видеоролики смешивать со слайдами запрещено.');
      return;
    }

    // Rule: VIDEO allows video only
    if (displayMode === 'VIDEO' && asset.media_type !== 'VIDEO') {
      setWarningMsg('Для режима «Видео» выберите видеофайл формата MP4.');
      return;
    }

    if (displayMode === 'STATIC') {
      if (asset.media_type === 'VIDEO') {
        setWarningMsg('Для статичного баннера выберите статичное изображение, либо переключите режим на «Видео».');
        return;
      }
      setSelectedItems([{ media_asset_id: asset.id, duration_seconds: 7 }]);
    } else if (displayMode === 'VIDEO') {
      setSelectedItems([{ media_asset_id: asset.id, duration_seconds: 15 }]);
    } else {
      if (selectedItems.length >= 20) {
        setWarningMsg('Максимальное количество слайдов в плейлисте — 20.');
        return;
      }
      setSelectedItems([...selectedItems, { media_asset_id: asset.id, duration_seconds: 7 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= selectedItems.length) return;
    const newItems = [...selectedItems];
    const temp = newItems[index];
    newItems[index] = newItems[target];
    newItems[target] = temp;
    setSelectedItems(newItems);
  };

  const handleDurationChange = (index: number, dur: number) => {
    const clamped = Math.max(1, Math.min(60, dur || 1));
    const newItems = [...selectedItems];
    newItems[index].duration_seconds = clamped;
    setSelectedItems(newItems);
  };

  const handleRefreshFromConflict = async () => {
    setOccConflictModalOpen(false);
    setError(null);
    if (isEditing) {
      await refetchBlock();
    }
  };

  const totalCycleSeconds = selectedItems.reduce((sum, item) => sum + (item.duration_seconds || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setWarningMsg(null);

    if (selectedItems.length === 0) {
      setError('Плейлист пуст. Выберите хотя бы один медиа-файл.');
      return;
    }

    if (displayMode === 'SLIDESHOW' && selectedItems.length < 2) {
      setError('Для режима Слайдшоу необходимо как минимум 2 слайда (максимум 20).');
      return;
    }

    setSaving(true);
    try {
      const itemsPayload = selectedItems.map((it, idx) => ({
        media_asset_id: it.media_asset_id,
        order_index: idx,
        duration_seconds: it.duration_seconds,
      }));

      if (isEditing && id) {
        // Update existing template with OCC version
        await templateApi.update(id, {
          name,
          description,
          area,
          display_mode: displayMode,
          is_active: true,
          items: itemsPayload,
          version: version ?? undefined,
        });
      } else {
        // Create new template
        await templateApi.create({
          name,
          description,
          area,
          display_mode: displayMode,
          is_active: true,
          items: itemsPayload,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      navigate('/blocks');
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        setOccConflictModalOpen(true);
      } else if (err?.status === 409) {
        setOccConflictModalOpen(true);
      } else {
        setError(err.message || 'Ошибка сохранения шаблона');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingBlock) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Загрузка параметров рекламного блока...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/blocks')}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {isEditing ? `Редактирование: ${name || 'Шаблон'}` : 'Новый рекламный шаблон'}
              </h2>
              {isEditing && version !== null && (
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  v{version}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              Настройка зоны показа, плейлиста, таймингов слайдов и предпросмотр сцены
            </p>
          </div>
        </div>

        {isEditing && id && (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition shadow-sm space-x-2"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Предпросмотр</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warningMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-sm">
          <div className="flex items-center space-x-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>{warningMsg}</span>
          </div>
          <button onClick={() => setWarningMsg(null)} className="text-xs text-amber-600 hover:text-amber-800">
            Закрыть
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Base Parameters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-900 text-base">1. Общие параметры шаблона</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Название шаблона *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Промо Лето 2026 — Новза"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Описание кампании (опционально)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Для внутренних заметок маркетологов"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Область экрана (Area)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setArea('FULL_SCREEN')}
                  className={`p-3 rounded-xl border text-left transition ${
                    area === 'FULL_SCREEN'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-sm">Full Screen</p>
                  <p className="text-xs text-slate-500 mt-0.5">1024×768 (Режим ожидания)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setArea('MODE32_PROMO')}
                  className={`p-3 rounded-xl border text-left transition ${
                    area === 'MODE32_PROMO'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-sm">Mode 32 Promo</p>
                  <p className="text-xs text-slate-500 mt-0.5">512×768 (Правая половина 50/50)</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Режим отображения (Display Mode)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('STATIC');
                    if (selectedItems.length > 1) setSelectedItems([selectedItems[0]]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    displayMode === 'STATIC'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">Static</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">1 картинка</p>
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('SLIDESHOW')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    displayMode === 'SLIDESHOW'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">Slideshow</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">2..20 слайдов</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisplayMode('VIDEO');
                    if (selectedItems.length > 1) setSelectedItems([selectedItems[0]]);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    displayMode === 'VIDEO'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-semibold">Video</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">1 MP4 видео</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Playlist & Draggable Reorder */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="font-bold text-slate-900 text-base">
                  2. Плейлист материалов ({selectedItems.length})
                </h3>
                {displayMode === 'SLIDESHOW' && selectedItems.length > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Цикл: {totalCycleSeconds} сек.</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {displayMode === 'STATIC' && 'Выберите ровно 1 статичное изображение'}
                {displayMode === 'SLIDESHOW' && 'Перетаскивайте слайды за иконку для изменения порядка, настраивайте длительность показа от 1 до 60 сек.'}
                {displayMode === 'VIDEO' && 'Выберите 1 видеофайл MP4 для воспроизведения в зацикленном режиме'}
              </p>
            </div>
          </div>

          {/* Playlist Items with HTML5 Drag-and-Drop */}
          {selectedItems.length > 0 ? (
            <div className="space-y-3">
              {selectedItems.map((item, idx) => {
                const asset = mediaAssets?.find((a: any) => a.id === item.media_asset_id);
                return (
                  <div
                    key={`${item.media_asset_id}-${idx}`}
                    draggable={displayMode === 'SLIDESHOW'}
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition group cursor-default"
                  >
                    <div className="flex items-center space-x-3">
                      {displayMode === 'SLIDESHOW' && (
                        <div 
                          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 transition"
                          title="Перетащите для изменения порядка"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                      )}

                      <span className="font-mono text-xs text-slate-400 w-5">#{idx + 1}</span>

                      <div className="w-14 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                        {asset?.media_type === 'VIDEO' ? (
                          <VideoIcon className="w-5 h-5 text-slate-500" />
                        ) : asset ? (
                          <img
                            src={`/api/v1/media/${asset.id}/file`}
                            alt={asset.original_name}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-sm text-slate-900 truncate max-w-xs sm:max-w-sm">
                          {asset?.original_name || item.media_asset_id}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {asset?.width && asset?.height ? `${asset.width}×${asset.height}` : asset?.media_type} • {asset?.mime_type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Duration Slider & Input (1..60s) */}
                      {displayMode === 'SLIDESHOW' && (
                        <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={item.duration_seconds}
                            onChange={(e) => handleDurationChange(idx, parseInt(e.target.value) || 1)}
                            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            title="Длительность показа слайда"
                          />
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={item.duration_seconds}
                            onChange={(e) => handleDurationChange(idx, parseInt(e.target.value) || 1)}
                            className="w-12 border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs text-center font-mono focus:outline-none focus:border-indigo-500"
                          />
                          <span className="text-xs text-slate-500 font-medium">сек.</span>
                        </div>
                      )}

                      {/* Manual Up/Down Buttons */}
                      {displayMode === 'SLIDESHOW' && (
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveItem(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition"
                            title="Сдвинуть вверх"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === selectedItems.length - 1}
                            onClick={() => handleMoveItem(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition"
                            title="Сдвинуть вниз"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Удалить из плейлиста"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-slate-300 rounded-2xl text-center text-sm text-slate-400">
              Плейлист пуст. Выберите файлы из медиатеки ниже, чтобы добавить их в шаблон.
            </div>
          )}

          {/* Media Picker Grid */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Добавить из медиатеки
              </h4>
              <span className="text-xs text-slate-400">
                Нажмите на файл для добавления
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1">
              {mediaAssets?.map((asset: any) => {
                const isVideo = asset.media_type === 'VIDEO';
                const isSelected = selectedItems.some((it) => it.media_asset_id === asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => handleAddItem(asset)}
                    className={`group relative cursor-pointer border rounded-xl overflow-hidden transition aspect-[4/3] bg-slate-100 flex flex-col justify-end p-2 ${
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 hover:border-indigo-400 hover:shadow-sm'
                    }`}
                  >
                    {isVideo ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-300">
                        <VideoIcon className="w-8 h-8" />
                      </div>
                    ) : (
                      <img
                        src={`/api/v1/media/${asset.id}/file`}
                        alt={asset.original_name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}

                    <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <Plus className="w-6 h-6" />
                    </div>

                    <div className="relative z-10 bg-slate-900/80 backdrop-blur-xs rounded px-1.5 py-0.5 text-[10px] text-white truncate">
                      {asset.original_name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/blocks')}
            className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm space-x-2 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать рекламный блок'}
          </button>
        </div>
      </form>

      {/* OCC Conflict Modal Dialog (HTTP 409) */}
      {occConflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Конфликт версий (OCC)</h3>
                <p className="text-xs text-slate-500 font-mono">HTTP 409 Conflict</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Этот рекламный шаблон был изменён другим оператором в параллельной сессии. Ваши локальные изменения устарели и не могут быть записаны поверх свежих данных во избежание потери данных.
            </p>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
              Обновите данные с сервера, чтобы увидеть актуальную версию шаблона и внести правки заново.
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setOccConflictModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={handleRefreshFromConflict}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Обновить с сервера</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && id && (
        <TemplatePreviewModal
          templateId={id}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
};
