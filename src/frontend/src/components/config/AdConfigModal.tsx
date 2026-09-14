import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Monitor, 
  Columns, 
  Image as ImageIcon, 
  Film, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Layers, 
  Send,
  Loader2,
  ShieldCheck,
  Info,
  ArrowUp,
  ArrowDown,
  Trash2,
  Play,
  Pause,
  Plus,
  Save
} from 'lucide-react';
import { 
  mediaApi, 
  advertisingApi, 
  publicationsApi, 
  Cashier, 
  Branch, 
  Region, 
  MediaAsset,
  PlaylistItemInput,
  AdvertisingBlockDetail
} from '../../api/client';

interface AdConfigModalProps {
  initialCashierIds?: string[];
  initialBlock?: AdvertisingBlockDetail | null;
  cashiers: Cashier[];
  branches: Branch[];
  regions: Region[];
  onClose: () => void;
  onDispatched: (batchId: string) => void;
}

export const AdConfigModal: React.FC<AdConfigModalProps> = ({
  initialCashierIds = [],
  initialBlock,
  cashiers,
  branches,
  regions,
  onClose,
  onDispatched,
}) => {
  // Step: 1 = Template & Media, 2 = Targeting & Launch
  const [step, setStep] = useState<1 | 2>(1);

  // Template metadata
  const [templateName, setTemplateName] = useState('Промо-кампания ' + new Date().toLocaleDateString('ru-RU'));
  const [area, setArea] = useState<'FULL_SCREEN' | 'MODE32_PROMO'>('FULL_SCREEN');
  const [displayMode, setDisplayMode] = useState<'STATIC' | 'SLIDESHOW' | 'VIDEO'>('STATIC');

  // Playlist items: array of { mediaAsset: MediaAsset, duration: number }
  const [playlistItems, setPlaylistItems] = useState<Array<{ asset: MediaAsset; duration: number }>>([]);
  const [selectedSingleAssetId, setSelectedSingleAssetId] = useState<string>('');

  // Targeting scope
  const [scopeType, setScopeType] = useState<'CUSTOM_CASHIERS' | 'BRANCH' | 'REGION'>(
    initialCashierIds.length > 0 ? 'CUSTOM_CASHIERS' : 'CUSTOM_CASHIERS'
  );
  const [selectedCashierIds, setSelectedCashierIds] = useState<string[]>(initialCashierIds.length > 0 ? initialCashierIds : cashiers.map(c => c.id));
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [selectedRegionId, setSelectedRegionId] = useState<string>(regions[0]?.id || '');

  // Live preview simulator
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);

  // Loading & error
  const queryClient = useQueryClient();
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Current active template (if editing existing or selected from list)
  const [currentBlock, setCurrentBlock] = useState<AdvertisingBlockDetail | null>(initialBlock || null);

  // Available blocks from API
  const { data: availableBlocks = [] } = useQuery({
    queryKey: ['advertising-blocks'],
    queryFn: () => advertisingApi.list(),
  });

  // Populate form from a block detail
  const loadBlockData = (block: AdvertisingBlockDetail) => {
    setCurrentBlock(block);
    setTemplateName(block.name);
    setArea(block.area);
    setDisplayMode(block.display_mode);
    if (block.items && block.items.length > 0) {
      setPlaylistItems(
        block.items.map((it) => ({
          asset: {
            id: it.media?.id || it.media_asset_id,
            original_name: it.media?.original_name || '',
            stored_name: it.media?.stored_name || '',
            media_type: (it.media?.media_type || 'IMAGE') as any,
            mime_type: 'image/jpeg',
            size_bytes: 0,
            sha256: '',
            width: 1920,
            height: 1080,
            version: 1,
            is_deleted: false,
            created_at: '',
            updated_at: '',
          } as MediaAsset,
          duration: it.duration_seconds || 7,
        }))
      );
      const firstAssetId = block.items[0].media?.id || block.items[0].media_asset_id;
      if (firstAssetId) {
        setSelectedSingleAssetId(firstAssetId);
      }
    } else {
      setPlaylistItems([]);
      setSelectedSingleAssetId('');
    }
  };

  // Initialize from initialBlock if passed
  useEffect(() => {
    if (initialBlock) {
      loadBlockData(initialBlock);
    } else {
      setCurrentBlock(null);
    }
  }, [initialBlock]);

  // Handle choosing another template from dropdown
  const handleSelectExistingTemplate = async (blockId: string) => {
    if (!blockId) {
      setCurrentBlock(null);
      setTemplateName('Промо-кампания ' + new Date().toLocaleDateString('ru-RU'));
      setArea('FULL_SCREEN');
      setDisplayMode('STATIC');
      setPlaylistItems([]);
      setSelectedSingleAssetId('');
      return;
    }
    try {
      const fullDetail = await advertisingApi.get(blockId);
      loadBlockData(fullDetail);
    } catch (err: any) {
      setDeployError('Ошибка загрузки шаблона: ' + err.message);
    }
  };

  // Handle Save Template without dispatch
  const handleSaveTemplate = async () => {
    if (!currentBlock) return;
    try {
      setIsSaving(true);
      setDeployError(null);

      let itemsPayload: PlaylistItemInput[] = [];
      if (displayMode === 'STATIC') {
        if (!selectedSingleAssetId) {
          throw new Error('Выберите изображение для статического баннера');
        }
        itemsPayload = [{
          media_asset_id: selectedSingleAssetId,
          order_index: 0,
          duration_seconds: 10,
        }];
      } else {
        if (playlistItems.length === 0) {
          throw new Error('Добавьте хотя бы один слайд в плейлист');
        }
        itemsPayload = playlistItems.map((it, idx) => ({
          media_asset_id: it.asset.id,
          order_index: idx,
          duration_seconds: it.duration,
        }));
      }

      await advertisingApi.update(currentBlock.id, {
        name: templateName.trim() || 'Рекламный блок',
        area,
        display_mode: displayMode,
        items: itemsPayload,
      });

      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['advertising-block', currentBlock.id] });
      onClose();
    } catch (err: any) {
      setDeployError(err.message || 'Ошибка сохранения шаблона');
    } finally {
      setIsSaving(false);
    }
  };

  // Load Media Assets from real FastAPI
  const { data: mediaList = [], isLoading: loadingMedia } = useQuery({
    queryKey: ['media'],
    queryFn: () => mediaApi.list({ limit: 100 }),
  });

  // Filter media based on aspect ratio fit
  const suitableMedia = useMemo(() => {
    return mediaList.filter(m => {
      if (area === 'FULL_SCREEN') {
        // Prefer 4:3 (e.g. 1024x768) or any image
        return true;
      } else {
        // 50/50 order promo prefers vertical / 2:3 (e.g. 512x768)
        return true;
      }
    });
  }, [mediaList, area]);

  // Set default single asset once media loaded
  useEffect(() => {
    if (suitableMedia.length > 0 && !selectedSingleAssetId && !initialBlock) {
      setSelectedSingleAssetId(suitableMedia[0].id);
    }
  }, [suitableMedia, selectedSingleAssetId, initialBlock]);

  // If switched to slideshow and empty, seed with 2 slides
  useEffect(() => {
    if (!initialBlock && displayMode === 'SLIDESHOW' && playlistItems.length === 0 && suitableMedia.length > 0) {
      setPlaylistItems(suitableMedia.slice(0, Math.min(3, suitableMedia.length)).map(asset => ({
        asset,
        duration: 7,
      })));
    }
  }, [displayMode, suitableMedia, playlistItems.length]);

  // Slideshow auto-advance simulator
  useEffect(() => {
    if (displayMode !== 'SLIDESHOW' || playlistItems.length <= 1 || !isPlayingPreview) return;
    const currentDur = playlistItems[previewSlideIdx]?.duration || 5;
    const timer = setTimeout(() => {
      setPreviewSlideIdx((prev) => (prev + 1) % playlistItems.length);
    }, currentDur * 1000);
    return () => clearTimeout(timer);
  }, [displayMode, playlistItems, previewSlideIdx, isPlayingPreview]);

  // Add slide to playlist
  const handleAddSlide = (asset: MediaAsset) => {
    setPlaylistItems(prev => [...prev, { asset, duration: 7 }]);
  };

  // Remove slide
  const handleRemoveSlide = (idx: number) => {
    setPlaylistItems(prev => prev.filter((_, i) => i !== idx));
    if (previewSlideIdx >= playlistItems.length - 1) {
      setPreviewSlideIdx(0);
    }
  };

  // Move slide up/down
  const handleMoveSlide = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= playlistItems.length) return;
    const clone = [...playlistItems];
    const temp = clone[idx];
    clone[idx] = clone[newIdx];
    clone[newIdx] = temp;
    setPlaylistItems(clone);
  };

  // Change duration
  const handleChangeDuration = (idx: number, dur: number) => {
    const clamped = Math.max(1, Math.min(60, dur));
    setPlaylistItems(prev => prev.map((item, i) => i === idx ? { ...item, duration: clamped } : item));
  };

  // Target count calculation
  const targetCount = useMemo(() => {
    if (scopeType === 'CUSTOM_CASHIERS') return selectedCashierIds.length;
    if (scopeType === 'BRANCH') return cashiers.filter(c => c.branch_id === selectedBranchId).length;
    if (scopeType === 'REGION') {
      const branchIdsInRegion = new Set(branches.filter(b => b.region_id === selectedRegionId).map(b => b.id));
      return cashiers.filter(c => branchIdsInRegion.has(c.branch_id)).length;
    }
    return cashiers.length;
  }, [scopeType, selectedCashierIds, selectedBranchId, selectedRegionId, cashiers, branches]);

  // Execute Dispatch
  const handleDispatch = async () => {
    try {
      setIsDeploying(true);
      setDeployError(null);

      // 1. Prepare items payload
      let itemsPayload: PlaylistItemInput[] = [];
      if (displayMode === 'STATIC') {
        if (!selectedSingleAssetId) {
          throw new Error('Выберите изображение для статического баннера');
        }
        itemsPayload = [{
          media_asset_id: selectedSingleAssetId,
          order_index: 0,
          duration_seconds: 10,
        }];
      } else {
        if (playlistItems.length === 0) {
          throw new Error('Добавьте хотя бы один слайд в плейлист');
        }
        itemsPayload = playlistItems.map((it, idx) => ({
          media_asset_id: it.asset.id,
          order_index: idx,
          duration_seconds: it.duration,
        }));
      }

      // 2. Create or Update Advertising Block via real FastAPI
      let blockId: string;
      if (currentBlock) {
        await advertisingApi.update(currentBlock.id, {
          name: templateName.trim() || 'Рекламный блок',
          area,
          display_mode: displayMode,
          items: itemsPayload,
        });
        blockId = currentBlock.id;
      } else {
        const blockRes = await advertisingApi.create({
          name: templateName.trim() || 'Рекламный блок',
          description: `Автоматически создан для деплоя ${new Date().toLocaleString('ru-RU')}`,
          area,
          display_mode: displayMode,
          is_active: true,
          items: itemsPayload,
        });
        blockId = blockRes.id;
      }

      // 3. Resolve target ids for publication dispatch
      let scopeTargetIds: string[] = [];
      if (scopeType === 'CUSTOM_CASHIERS') {
        scopeTargetIds = selectedCashierIds;
      } else if (scopeType === 'BRANCH') {
        scopeTargetIds = [selectedBranchId];
      } else if (scopeType === 'REGION') {
        scopeTargetIds = [selectedRegionId];
      }

      if (scopeTargetIds.length === 0) {
        throw new Error('Выберите хотя бы одну кассу для публикации');
      }

      // 4. Dispatch publication via real FastAPI POST /api/v1/publications
      const pubRes = await publicationsApi.dispatch({
        advertising_block_id: blockId,
        scope_type: scopeType,
        scope_target_ids: scopeTargetIds,
      });

      // 5. Notify parent to open live SSE tracking modal
      onDispatched(pubRes.batch_id);

    } catch (err: any) {
      setIsDeploying(false);
      setDeployError(err.message || 'Ошибка запуска публикации');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-850 border border-dark-750 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-750 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-accent-500/10 text-accent-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {currentBlock ? `Шаблон: ${currentBlock.name}` : 'Конфигуратор рекламы и деплой'}
              </h2>
              <p className="text-xs text-slate-400">
                Шаг {step} из 2: {step === 1 ? 'Настройка формата и выбор слайдов' : 'Выбор целевых касс и запуск'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Step Navigation Tabs */}
            <div className="flex bg-dark-900 border border-dark-750 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  step === 1 ? 'bg-accent-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Шаблон и слайды
              </button>
              <button
                type="button"
                onClick={() => {
                  if (displayMode === 'STATIC' && !selectedSingleAssetId) {
                    setDeployError('Выберите изображение для баннера');
                    return;
                  }
                  if (displayMode === 'SLIDESHOW' && playlistItems.length === 0) {
                    setDeployError('Добавьте хотя бы один слайд в плейлист');
                    return;
                  }
                  setDeployError(null);
                  setStep(2);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  step === 2 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Развернуть на кассы ({targetCount})
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-dark-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {deployError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{deployError}</span>
            </div>
            <button onClick={() => setDeployError(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {step === 1 ? (
            /* STEP 1: Format & Content */
            <div className="space-y-6">

              {/* Existing Template Picker / Switcher */}
              <div className="p-3.5 bg-dark-900/90 border border-dark-750 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent-500/15 text-accent-400 flex items-center justify-center flex-shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-semibold block text-xs">
                      {currentBlock ? `Выбран шаблон: "${currentBlock.name}"` : 'Новый шаблон (не сохранен)'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {currentBlock
                        ? `ID: ${currentBlock.id.slice(0, 8)}... • Формат: ${currentBlock.area === 'FULL_SCREEN' ? 'Full Screen (4:3)' : '50/50 Promo'} • Слайдов: ${currentBlock.items?.length || 0}`
                        : 'Вы можете выбрать один из сохраненных шаблонов или настроить новый с нуля'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-slate-400 text-xs whitespace-nowrap">Шаблон:</label>
                  <select
                    value={currentBlock?.id || ''}
                    onChange={(e) => handleSelectExistingTemplate(e.target.value)}
                    className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-accent-500 max-w-[280px]"
                  >
                    <option value="">+ Создать новый шаблон с нуля</option>
                    {availableBlocks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.area === 'FULL_SCREEN' ? 'Full Screen' : '50/50'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Name & Area Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Название рекламного блока *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="например: Осеннее промо 2026"
                    className="w-full bg-dark-900 border border-dark-750 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-accent-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Зона отображения (Screen Area) *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setArea('FULL_SCREEN')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                        area === 'FULL_SCREEN'
                          ? 'bg-accent-500/15 border-accent-500 text-white'
                          : 'bg-dark-900 border-dark-750 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>FULL SCREEN (4:3)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setArea('MODE32_PROMO')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                        area === 'MODE32_PROMO'
                          ? 'bg-emerald-500/15 border-emerald-500 text-white'
                          : 'bg-dark-900 border-dark-750 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Columns className="w-4 h-4" />
                      <span>50/50 PROMO (2:3)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mode Selection: Static vs Slideshow */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Тип показа *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('STATIC')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                      displayMode === 'STATIC'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-dark-900 border-dark-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Статический баннер (1 слайд)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDisplayMode('SLIDESHOW')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                      displayMode === 'SLIDESHOW'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white'
                        : 'bg-dark-900 border-dark-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Динамическое слайдшоу (Плейлист)</span>
                  </button>
                </div>
              </div>

              {/* Mode Specific Configuration */}
              {displayMode === 'STATIC' ? (
                /* STATIC BANNER PICKER */
                <div className="space-y-3">
                  <label className="text-slate-300 block font-semibold">Выберите файл баннера из библиотеки</label>
                  
                  {loadingMedia ? (
                    <div className="text-center py-8 text-slate-500">Загрузка медиафайлов...</div>
                  ) : suitableMedia.length === 0 ? (
                    <div className="p-6 bg-dark-900 border border-dark-750 rounded-xl text-center text-slate-400">
                      В библиотеке нет загруженных медиа. Перейдите в раздел "Медиа", чтобы загрузить файлы.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {suitableMedia.map((m) => {
                        const isSelected = selectedSingleAssetId === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedSingleAssetId(m.id)}
                            className={`cursor-pointer rounded-xl border p-2 flex flex-col justify-between transition-all bg-dark-900 ${
                              isSelected 
                                ? 'border-accent-500 shadow-md shadow-accent-500/20 ring-1 ring-accent-500' 
                                : 'border-dark-750 hover:border-dark-700'
                            }`}
                          >
                            <div className="aspect-[4/3] bg-dark-850 rounded-lg overflow-hidden flex items-center justify-center mb-1.5 relative border border-dark-750/50">
                              <img
                                src={mediaApi.getThumbnailUrl(m.id)}
                                alt={m.original_name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = mediaApi.getFileUrl(m.id);
                                }}
                              />
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-accent-500 text-white flex items-center justify-center shadow">
                                  ✓
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-white truncate block" title={m.original_name}>
                              {m.original_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {m.width}×{m.height}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* DYNAMIC SLIDESHOW PLAYLIST BUILDER */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Playlist ordered items */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300">
                        Слайды плейлиста ({playlistItems.length})
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Общий цикл: {playlistItems.reduce((acc, it) => acc + it.duration, 0)} сек
                      </span>
                    </div>

                    {playlistItems.length === 0 ? (
                      <div className="p-6 bg-dark-900 border border-dark-750 rounded-xl text-center text-slate-500">
                        Плейлист пуст. Выберите слайды справа для добавления.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {playlistItems.map((item, idx) => (
                          <div
                            key={`${item.asset.id}-${idx}`}
                            className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                              previewSlideIdx === idx ? 'bg-dark-800 border-accent-500/50' : 'bg-dark-900 border-dark-750'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-slate-500 text-xs w-4 text-center">{idx + 1}</span>
                              <img
                                src={mediaApi.getThumbnailUrl(item.asset.id)}
                                alt=""
                                className="w-10 h-10 object-cover rounded-lg bg-dark-850 border border-dark-750/50"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = mediaApi.getFileUrl(item.asset.id);
                                }}
                              />
                              <div className="max-w-[120px]">
                                <span className="font-medium text-white block truncate text-[11px]" title={item.asset.original_name}>
                                  {item.asset.original_name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {item.asset.width}×{item.asset.height}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Duration Input */}
                              <div className="flex items-center space-x-1 bg-dark-950 px-2 py-1 rounded-lg border border-dark-750">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={item.duration}
                                  onChange={(e) => handleChangeDuration(idx, Number(e.target.value))}
                                  className="w-8 bg-transparent text-center font-mono text-white text-xs focus:outline-none"
                                />
                                <span className="text-slate-500 text-[10px]">с</span>
                              </div>

                              {/* Move Controls */}
                              <div className="flex items-center space-x-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveSlide(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveSlide(idx, 'down')}
                                  disabled={idx === playlistItems.length - 1}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSlide(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Library picker to add slides */}
                  <div className="space-y-3">
                    <span className="font-semibold text-slate-300 block">
                      Добавить из медиа-библиотеки (нажмите для добавления)
                    </span>
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {suitableMedia.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleAddSlide(m)}
                          className="cursor-pointer bg-dark-900 border border-dark-750 hover:border-accent-500 rounded-xl p-1.5 transition-all group"
                        >
                          <div className="aspect-[4/3] bg-dark-850 rounded-lg overflow-hidden flex items-center justify-center relative mb-1 border border-dark-750/50">
                            <img
                              src={mediaApi.getThumbnailUrl(m.id)}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = mediaApi.getFileUrl(m.id);
                              }}
                            />
                            <div className="absolute inset-0 bg-accent-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Plus className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-300 block truncate" title={m.original_name}>
                            {m.original_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            /* STEP 2: Targeting Scope & Dispatch Confirmation */
            <div className="space-y-6">
              
              <div className="bg-dark-900 border border-dark-750 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs border-b border-dark-750 pb-2 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-accent-400" />
                  <span>Область назначения рекламы (Target Scope)</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setScopeType('CUSTOM_CASHIERS')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      scopeType === 'CUSTOM_CASHIERS'
                        ? 'bg-accent-500/15 border-accent-500 text-white'
                        : 'bg-dark-850 border-dark-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    Выбранные кассы ({selectedCashierIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeType('BRANCH')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      scopeType === 'BRANCH'
                        ? 'bg-accent-500/15 border-accent-500 text-white'
                        : 'bg-dark-850 border-dark-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    По филиалу
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeType('REGION')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      scopeType === 'REGION'
                        ? 'bg-accent-500/15 border-accent-500 text-white'
                        : 'bg-dark-850 border-dark-750 text-slate-400 hover:text-white'
                    }`}
                  >
                    По региону
                  </button>
                </div>

                {/* Scope selector controls */}
                {scopeType === 'CUSTOM_CASHIERS' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-slate-400 text-[11px]">
                      <span>Отметьте кассы для развертывания:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedCashierIds(selectedCashierIds.length === cashiers.length ? [] : cashiers.map(c => c.id))}
                        className="text-accent-400 hover:underline"
                      >
                        {selectedCashierIds.length === cashiers.length ? 'Снять все' : 'Выбрать все'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {cashiers.map((c) => {
                        const isChecked = selectedCashierIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${
                              isChecked ? 'bg-accent-500/10 border-accent-500/40 text-white' : 'bg-dark-850 border-dark-750 text-slate-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedCashierIds(prev =>
                                  prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                                );
                              }}
                              className="rounded border-dark-700 bg-dark-900 text-accent-500"
                            />
                            <div className="truncate">
                              <span className="font-bold text-[11px] block truncate">{c.name}</span>
                              <span className="font-mono text-[10px] text-slate-500">{c.ip_address}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {scopeType === 'BRANCH' && (
                  <div className="pt-2">
                    <label className="text-slate-300 block mb-1 font-semibold">Выберите филиал</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full bg-dark-850 border border-dark-750 rounded-xl p-2.5 text-white"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {scopeType === 'REGION' && (
                  <div className="pt-2">
                    <label className="text-slate-300 block mb-1 font-semibold">Выберите регион</label>
                    <select
                      value={selectedRegionId}
                      onChange={(e) => setSelectedRegionId(e.target.value)}
                      className="w-full bg-dark-850 border border-dark-750 rounded-xl p-2.5 text-white"
                    >
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>
                )}

              </div>

              {/* Summary Pre-Flight Card */}
              <div className="bg-dark-900 border border-dark-750 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs border-b border-dark-750 pb-2">
                  Итоговая сводка деплоя (Pre-flight check)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Название блока:</span>
                    <span className="text-white font-bold">{templateName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Зона экрана:</span>
                    <span className="text-accent-400 font-bold">{area === 'FULL_SCREEN' ? 'FULL SCREEN (1024×768)' : '50/50 PROMO (512×768)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Режим контента:</span>
                    <span className="text-slate-200">{displayMode === 'STATIC' ? 'Статический баннер' : `Слайдшоу (${playlistItems.length} слайдов)`}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Целевых устройств:</span>
                    <span className="text-emerald-400 font-bold font-mono text-sm">{targetCount} касс</span>
                  </div>
                </div>

                <div className="p-3 bg-dark-950 rounded-xl border border-dark-750/60 text-slate-400 text-[11px] leading-relaxed">
                  Публикация будет обработана через транзакционный конвейер FastAPI: проверка хешей SHA-256, безопасная доставка в staging по SSH/SFTP, атомарное обновление базы <code className="text-white">gs.db</code> и hot-reload без перезапуска кассы.
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-dark-750 bg-dark-900/40 flex items-center justify-between">
          {step === 1 ? (
            <div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-dark-800"
              >
                Отмена
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-dark-800"
              >
                ← Назад
              </button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {step === 1 ? (
              <>
                {currentBlock && (
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center space-x-1.5 shadow-lg shadow-blue-600/25"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Сохранение...' : 'Сохранить шаблон'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (displayMode === 'STATIC' && !selectedSingleAssetId) {
                      setDeployError('Выберите изображение для баннера');
                      return;
                    }
                    if (displayMode === 'SLIDESHOW' && playlistItems.length === 0) {
                      setDeployError('Добавьте хотя бы один слайд в плейлист');
                      return;
                    }
                    setDeployError(null);
                    setStep(2);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 flex items-center space-x-1.5 shadow-lg shadow-accent-500/25"
                >
                  <span>Далее: Выбор касс</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isDeploying || targetCount === 0}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-emerald-600/30"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Запуск публикации...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Запустить деплой на {targetCount} касс</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
