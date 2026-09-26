import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCloseLine as X, 
  RiComputerLine as Monitor, 
  RiLayoutColumnLine as Columns, 
  RiImage2Line as ImageIcon, 
  RiMovie2Line as Film, 
  RiTimeLine as Clock, 
  RiCheckboxCircleLine as CheckCircle2, 
  RiAlertLine as AlertTriangle, 
  RiArrowRightSLine as ChevronRight, 
  RiStackLine as Layers, 
  RiSendPlane2Line as Send,
  RiLoader4Line as Loader2,
  RiShieldCheckLine as ShieldCheck,
  RiInformationLine as Info,
  RiArrowUpLine as ArrowUp,
  RiArrowDownLine as ArrowDown,
  RiDeleteBinLine as Trash2,
  RiPlayLine as Play,
  RiPauseLine as Pause,
  RiAddLine as Plus,
  RiSave3Line as Save,
  RiCalendarLine as CalendarIcon,
  RiStarFill as StarFilled,
  RiTimerLine as TimerIcon
} from 'react-icons/ri';
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
import { CustomDropdown } from '../ui/CustomDropdown';

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

  // Scheduling & Default Template metadata
  const [isDefault, setIsDefault] = useState(false);
  const [scheduleType, setScheduleType] = useState<'PERMANENT' | 'DAYS' | 'DATE_RANGE'>('PERMANENT');
  const [scheduleDays, setScheduleDays] = useState<number>(10);
  const [validFrom, setValidFrom] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [validTo, setValidTo] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });

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
    setIsDefault(Boolean(block.is_default));
    setScheduleType(block.schedule_type || (block.valid_to ? 'DATE_RANGE' : 'PERMANENT'));
    setScheduleDays(block.schedule_days || 10);
    if (block.valid_from) {
      setValidFrom(block.valid_from.split('T')[0]);
    } else {
      setValidFrom(new Date().toISOString().split('T')[0]);
    }
    if (block.valid_to) {
      setValidTo(block.valid_to.split('T')[0]);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      setValidTo(d.toISOString().split('T')[0]);
    }

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
      setIsDefault(false);
      setScheduleType('PERMANENT');
      setScheduleDays(10);
      const today = new Date().toISOString().split('T')[0];
      setValidFrom(today);
      const d = new Date();
      d.setDate(d.getDate() + 10);
      setValidTo(d.toISOString().split('T')[0]);
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

      let calculatedValidFrom: string | null = null;
      let calculatedValidTo: string | null = null;

      if (scheduleType === 'DAYS') {
        const now = new Date();
        calculatedValidFrom = now.toISOString();
        const end = new Date(now.getTime() + scheduleDays * 24 * 60 * 60 * 1000);
        calculatedValidTo = end.toISOString();
      } else if (scheduleType === 'DATE_RANGE') {
        calculatedValidFrom = validFrom ? new Date(validFrom + 'T00:00:00Z').toISOString() : null;
        calculatedValidTo = validTo ? new Date(validTo + 'T23:59:59Z').toISOString() : null;
      }

      await advertisingApi.update(currentBlock.id, {
        name: templateName.trim() || 'Рекламный блок',
        area,
        display_mode: displayMode,
        is_default: isDefault,
        schedule_type: scheduleType,
        schedule_days: scheduleType === 'DAYS' ? scheduleDays : null,
        valid_from: calculatedValidFrom,
        valid_to: calculatedValidTo,
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
      let calculatedValidFrom: string | null = null;
      let calculatedValidTo: string | null = null;

      if (scheduleType === 'DAYS') {
        const now = new Date();
        calculatedValidFrom = now.toISOString();
        const end = new Date(now.getTime() + scheduleDays * 24 * 60 * 60 * 1000);
        calculatedValidTo = end.toISOString();
      } else if (scheduleType === 'DATE_RANGE') {
        calculatedValidFrom = validFrom ? new Date(validFrom + 'T00:00:00Z').toISOString() : null;
        calculatedValidTo = validTo ? new Date(validTo + 'T23:59:59Z').toISOString() : null;
      }

      let blockId: string;
      if (currentBlock) {
        await advertisingApi.update(currentBlock.id, {
          name: templateName.trim() || 'Рекламный блок',
          area,
          display_mode: displayMode,
          is_default: isDefault,
          schedule_type: scheduleType,
          schedule_days: scheduleType === 'DAYS' ? scheduleDays : null,
          valid_from: calculatedValidFrom,
          valid_to: calculatedValidTo,
          items: itemsPayload,
        });
        blockId = currentBlock.id;
      } else {
        const blockRes = await advertisingApi.create({
          name: templateName.trim() || 'Рекламный блок',
          description: `Создан для деплоя ${new Date().toLocaleString('ru-RU')}`,
          area,
          display_mode: displayMode,
          is_active: true,
          is_default: isDefault,
          schedule_type: scheduleType,
          schedule_days: scheduleType === 'DAYS' ? scheduleDays : null,
          valid_from: calculatedValidFrom,
          valid_to: calculatedValidTo,
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

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-up cursor-default"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-300 flex items-center justify-center">
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
            <div className="flex glass-surface-l2 border border-white/10 rounded-xl p-1 text-xs relative">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`relative px-3.5 py-1.5 rounded-lg font-medium transition-colors z-10 ${
                  step === 1 ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {step === 1 && (
                  <motion.div
                    layoutId="adConfigStepPill"
                    className="absolute inset-0 bg-blue-600 rounded-lg -z-10 shadow-sm shadow-blue-600/30"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
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
                className={`relative px-3.5 py-1.5 rounded-lg font-medium transition-colors z-10 ${
                  step === 2 ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {step === 2 && (
                  <motion.div
                    layoutId="adConfigStepPill"
                    className="absolute inset-0 bg-emerald-600 rounded-lg -z-10 shadow-sm shadow-emerald-600/20"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                2. Развернуть на кассы ({targetCount})
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
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
              <div className="p-3.5 glass-surface-l3 border border-white/[0.08] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-300 flex items-center justify-center flex-shrink-0">
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
                  <CustomDropdown
                    value={currentBlock?.id || ''}
                    onChange={(val) => handleSelectExistingTemplate(val)}
                    options={[
                      { value: '', label: '+ Создать новый шаблон с нуля' },
                      ...availableBlocks.map((b) => ({
                        value: b.id,
                        label: b.name,
                        badge: b.area === 'FULL_SCREEN' ? '4:3' : '50/50'
                      }))
                    ]}
                    className="max-w-[280px]"
                    menuClassName="w-72"
                  />
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
                    className="glass-input w-full p-2.5 text-white font-medium focus:outline-none"
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
                          ? 'bg-teal-500/15 border-teal-400 text-white'
                          : 'glass-surface-l2 border-white/10 text-slate-400 hover:text-white'
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
                          : 'glass-surface-l2 border-white/10 text-slate-400 hover:text-white'
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
                        : 'glass-surface-l2 border-white/10 text-slate-400 hover:text-white'
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
                        : 'glass-surface-l2 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Film className="w-4 h-4" />
                    <span>Динамическое слайдшоу (Плейлист)</span>
                  </button>
                </div>
              </div>

              {/* 📅 РАСПИСАНИЕ И ПЕРИОД ПОКАЗА (Scheduling & Default Fallback) */}
              <div className="glass-surface-l2 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">Расписание и период показа</h4>
                      <span className="text-[11px] text-slate-400">
                        Период действия кампании и автоматический возврат на дефолтный шаблон
                      </span>
                    </div>
                  </div>

                  {isDefault && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 self-start sm:self-auto shadow-sm">
                      <StarFilled className="w-3 h-3 text-amber-400" />
                      <span>Дефолтный шаблон</span>
                    </span>
                  )}
                </div>

                {/* Schedule Type Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScheduleType('PERMANENT')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      scheduleType === 'PERMANENT'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-md shadow-blue-600/20 ring-1 ring-blue-500/40'
                        : 'glass-surface-l1 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs">Постоянный показ</span>
                    <span className="text-[10px] opacity-75 mt-0.5">Бессрочно / Всегда</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScheduleType('DAYS');
                      if (!scheduleDays) setScheduleDays(10);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      scheduleType === 'DAYS'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-md shadow-blue-600/20 ring-1 ring-blue-500/40'
                        : 'glass-surface-l1 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs">На период (Дни)</span>
                    <span className="text-[10px] opacity-75 mt-0.5">10, 20 дней и др.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleType('DATE_RANGE')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      scheduleType === 'DATE_RANGE'
                        ? 'bg-blue-600/20 border-blue-500 text-white font-bold shadow-md shadow-blue-600/20 ring-1 ring-blue-500/40'
                        : 'glass-surface-l1 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs">Календарь дат</span>
                    <span className="text-[10px] opacity-75 mt-0.5">До точного числа</span>
                  </button>
                </div>

                {/* Sub-panel: PERMANENT */}
                {scheduleType === 'PERMANENT' && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4">
                    <div>
                      <span className="text-white font-semibold block text-xs">Сделать шаблоном по умолчанию (Fallback)</span>
                      <span className="text-slate-400 text-[11px]">
                        Когда временные акции заканчиваются, экраны касс автоматически возвращаются на этот дефолтный шаблон.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                )}

                {/* Sub-panel: DAYS */}
                {scheduleType === 'DAYS' && (
                  <div className="p-3.5 rounded-xl bg-blue-500/[0.05] border border-blue-500/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-slate-300 font-semibold text-xs">Выберите или введите количество дней:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[7, 10, 14, 20, 30].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setScheduleDays(d)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                              scheduleDays === d
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                            }`}
                          >
                            {d} дн.
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="w-full sm:w-28">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={scheduleDays}
                          onChange={(e) => setScheduleDays(Math.max(1, parseInt(e.target.value) || 1))}
                          className="glass-input w-full p-2 text-white font-mono text-xs text-center focus:outline-none"
                        />
                      </div>
                      <div className="flex-1 text-[11px] text-slate-300 bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <span>Срок показа: </span>
                        <strong className="text-cyan-400 font-mono">
                          {new Date().toLocaleDateString('ru-RU')} — {new Date(Date.now() + scheduleDays * 86400000).toLocaleDateString('ru-RU')}
                        </strong>
                        <span className="text-slate-400 block mt-0.5">
                          По окончании {scheduleDays} дней система автоматически вернёт кассы на дефолтный шаблон.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-panel: DATE_RANGE */}
                {scheduleType === 'DATE_RANGE' && (
                  <div className="p-3.5 rounded-xl bg-indigo-500/[0.05] border border-indigo-500/20 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1 font-semibold">Дата начала показа</label>
                        <input
                          type="date"
                          value={validFrom}
                          onChange={(e) => setValidFrom(e.target.value)}
                          className="glass-input w-full p-2 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1 font-semibold">Дата окончания (До какого числа)</label>
                        <input
                          type="date"
                          value={validTo}
                          onChange={(e) => setValidTo(e.target.value)}
                          className="glass-input w-full p-2 text-white font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <span>По истечении даты окончания кассы автоматически переключатся на дефолтный шаблон.</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            setValidFrom(d.toISOString().split('T')[0]);
                            d.setDate(d.getDate() + 10);
                            setValidTo(d.toISOString().split('T')[0]);
                          }}
                          className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                        >
                          +10 дней
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            setValidFrom(d.toISOString().split('T')[0]);
                            d.setDate(d.getDate() + 20);
                            setValidTo(d.toISOString().split('T')[0]);
                          }}
                          className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                        >
                          +20 дней
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Specific Configuration */}
              {displayMode === 'STATIC' ? (
                /* STATIC BANNER PICKER */
                <div className="space-y-3">
                  <label className="text-slate-300 block font-semibold">Выберите файл баннера из библиотеки</label>
                  
                  {loadingMedia ? (
                    <div className="text-center py-8 text-slate-500">Загрузка медиафайлов...</div>
                  ) : suitableMedia.length === 0 ? (
                    <div className="p-6 glass-surface-l2 border border-white/10 rounded-xl text-center text-slate-400">
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
                            className={`cursor-pointer rounded-xl border p-2 flex flex-col justify-between transition-all glass-surface-l2 ${
                              isSelected 
                                ? 'border-teal-400 shadow-md shadow-teal-400/20 ring-1 ring-teal-400' 
                                : 'border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="aspect-[4/3] bg-black/30 rounded-lg overflow-hidden flex items-center justify-center mb-1.5 relative border border-white/10">
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
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-teal-400 text-black flex items-center justify-center shadow">
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
                      <div className="p-6 glass-surface-l2 border border-white/10 rounded-xl text-center text-slate-500">
                        Плейлист пуст. Выберите слайды справа для добавления.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {playlistItems.map((item, idx) => (
                          <div
                            key={`${item.asset.id}-${idx}`}
                            className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                              previewSlideIdx === idx ? 'glass-surface-l3 border-teal-400/50' : 'glass-surface-l2 border-white/10'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-slate-500 text-xs w-4 text-center">{idx + 1}</span>
                              <img
                                src={mediaApi.getThumbnailUrl(item.asset.id)}
                                alt=""
                                className="w-10 h-10 object-cover rounded-lg bg-black/30 border border-white/10"
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
                              <div className="flex items-center space-x-1 glass-surface-l3 px-2 py-1 rounded-lg border border-white/[0.08]">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={item.duration}
                                  onChange={(e) => handleChangeDuration(idx, Number(e.target.value))}
                                  className="w-8 !bg-transparent !p-0 !min-h-0 !border-0 text-center font-mono text-white text-xs focus:outline-none"
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
                          className="cursor-pointer glass-surface-l2 border border-white/10 hover:border-teal-400 rounded-xl p-1.5 transition-all group"
                        >
                          <div className="aspect-[4/3] bg-black/30 rounded-lg overflow-hidden flex items-center justify-center relative mb-1 border border-white/10">
                            <img
                              src={mediaApi.getThumbnailUrl(m.id)}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = mediaApi.getFileUrl(m.id);
                              }}
                            />
                            <div className="absolute inset-0 bg-teal-400/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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
              
              <div className="glass-surface-l2 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs border-b border-white/[0.08] pb-2 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-teal-300" />
                  <span>Область назначения рекламы (Target Scope)</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setScopeType('CUSTOM_CASHIERS')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      scopeType === 'CUSTOM_CASHIERS'
                        ? 'bg-teal-500/15 border-teal-400 text-white'
                        : 'glass-surface-l2 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Выбранные кассы ({selectedCashierIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeType('BRANCH')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      scopeType === 'BRANCH'
                        ? 'bg-teal-500/15 border-teal-400 text-white'
                        : 'glass-surface-l2 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    По филиалу
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeType('REGION')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      scopeType === 'REGION'
                        ? 'bg-teal-500/15 border-teal-400 text-white'
                        : 'glass-surface-l2 border-white/10 text-slate-400 hover:text-white'
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
                        className="text-teal-300 hover:underline"
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
                              isChecked ? 'bg-teal-500/10 border-teal-400/40 text-white' : 'glass-surface-l2 border-white/10 text-slate-400'
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
                              className="rounded border-white/20 bg-white/5 text-teal-400"
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
                    <CustomDropdown
                      value={selectedBranchId}
                      onChange={(val) => setSelectedBranchId(val)}
                      options={branches.map(b => ({ value: b.id, label: `${b.name} (${b.code})` }))}
                      className="w-full"
                      menuClassName="w-full"
                    />
                  </div>
                )}

                {scopeType === 'REGION' && (
                  <div className="pt-2">
                    <label className="text-slate-300 block mb-1 font-semibold">Выберите регион</label>
                    <CustomDropdown
                      value={selectedRegionId}
                      onChange={(val) => setSelectedRegionId(val)}
                      options={regions.map(r => ({ value: r.id, label: `${r.name} (${r.code})` }))}
                      className="w-full"
                      menuClassName="w-full"
                    />
                  </div>
                )}

              </div>

              {/* Summary Pre-Flight Card */}
              <div className="glass-surface-l2 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs border-b border-white/[0.08] pb-2">
                  Итоговая сводка деплоя (Pre-flight check)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Название блока:</span>
                    <span className="text-white font-bold">{templateName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Зона экрана:</span>
                    <span className="text-teal-300 font-bold">{area === 'FULL_SCREEN' ? 'FULL SCREEN (1024×768)' : '50/50 PROMO (512×768)'}</span>
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

                <div className="p-3 glass-surface-l3 rounded-xl border border-white/[0.08] text-slate-400 text-[11px] leading-relaxed">
                  Публикация будет обработана через транзакционный конвейер FastAPI: проверка хешей SHA-256, безопасная доставка в staging по SSH/SFTP, атомарное обновление базы <code className="text-white">gs.db</code> и hot-reload без перезапуска кассы.
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-white/[0.08] bg-black/20 flex items-center justify-between">
          {step === 1 ? (
            <div>
              <button
                type="button"
                onClick={onClose}
                className="glass-btn-secondary px-4 py-2 rounded-xl"
              >
                Отмена
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="glass-btn-secondary px-4 py-2 rounded-xl"
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
                  className="glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5"
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
    </div>,
    document.body
  );
};
