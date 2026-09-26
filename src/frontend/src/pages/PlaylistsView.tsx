import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  RiMovie2Line, 
  RiAddLine, 
  RiDeleteBinLine, 
  RiFileCopyLine, 
  RiSendPlane2Line, 
  RiTv2Line, 
  RiLayoutColumnLine, 
  RiStackLine,
  RiEditLine,
  RiStarFill,
  RiCalendarLine,
  RiRefreshLine,
  RiTimeLine
} from 'react-icons/ri';
import { 
  advertisingApi, 
  topologyApi, 
  AdvertisingBlockDetail,
  mediaApi 
} from '../api/client';
import { AdConfigModal } from '../components/config/AdConfigModal';
import { DeploymentProgressModal } from '../components/deployment/DeploymentProgressModal';

export const PlaylistsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [areaFilter, setAreaFilter] = useState<'ALL' | 'FULL_SCREEN' | 'MODE32_PROMO' | 'DEFAULTS' | 'SCHEDULED'>('ALL');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Modals state
  const [adConfigOpen, setAdConfigOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AdvertisingBlockDetail | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Load advertising blocks from FastAPI GET /api/v1/advertising-blocks
  const { data: blocks = [], refetch } = useQuery({
    queryKey: ['advertising-blocks'],
    queryFn: () => advertisingApi.list(),
  });

  // Load cashiers, branches, regions for deployment modal
  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => topologyApi.listCashiers(),
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => topologyApi.listBranches(),
  });
  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => topologyApi.listRegions(),
  });

  // Load details of selected block
  const { data: blockDetail } = useQuery<AdvertisingBlockDetail>({
    queryKey: ['advertising-block', selectedBlockId],
    queryFn: () => advertisingApi.get(selectedBlockId!),
    enabled: !!selectedBlockId,
  });

  // Auto-select first block once loaded
  React.useEffect(() => {
    if (blocks.length > 0 && !selectedBlockId) {
      setSelectedBlockId(blocks[0].id);
    }
  }, [blocks, selectedBlockId]);

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => advertisingApi.duplicate(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      setSelectedBlockId(res.id);
    },
    onError: (err: any) => {
      alert(`Ошибка дублирования: ${err.message}`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => advertisingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      setSelectedBlockId(null);
    },
    onError: (err: any) => {
      alert(`Ошибка удаления блока: ${err.message}`);
    }
  });

  // Set Default mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => advertisingApi.setDefault(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['advertising-block', selectedBlockId] });
      alert(res.message);
    },
    onError: (err: any) => {
      alert(`Ошибка: ${err.message}`);
    }
  });

  // Recheck schedules mutation
  const recheckMutation = useMutation({
    mutationFn: () => advertisingApi.recheckSchedules(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      alert(res.message);
    },
    onError: (err: any) => {
      alert(`Ошибка проверки расписаний: ${err.message}`);
    }
  });

  const filteredBlocks = blocks.filter((b) => {
    if (areaFilter === 'FULL_SCREEN') return b.area === 'FULL_SCREEN';
    if (areaFilter === 'MODE32_PROMO') return b.area === 'MODE32_PROMO';
    if (areaFilter === 'DEFAULTS') return Boolean(b.is_default);
    if (areaFilter === 'SCHEDULED') return Boolean(b.valid_to || b.schedule_type === 'DAYS' || b.schedule_type === 'DATE_RANGE');
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <RiMovie2Line className="w-6 h-6 text-cyan-400" />
              Рекламные шаблоны и расписания
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#162033] text-cyan-400 border border-[#1e293b] shadow-sm">
              {blocks.length} блоков
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Управление шаблонами, таймингами, временными расписаниями и дефолтным возвратом контента на кассах
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => recheckMutation.mutate()}
            disabled={recheckMutation.isPending}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#162033] hover:bg-cyan-500/15 border border-[#1e293b] hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 flex items-center space-x-2 transition-all cursor-pointer shadow-sm"
            title="Проверить все кассы и вернуть экраны на дефолтные шаблоны, если срок акции истёк"
          >
            <RiRefreshLine className={`w-4 h-4 ${recheckMutation.isPending ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Проверить расписания</span>
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingBlock(null);
              setAdConfigOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center space-x-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <RiAddLine className="w-4 h-4 text-white font-bold" />
            <span>Создать рекламный блок</span>
          </motion.button>
        </div>
      </div>

      {/* Area & Schedule Filter Tabs with sliding active pill */}
      <div className="flex items-center space-x-1.5 bg-[#111928] border border-[#1e293b] p-1.5 rounded-2xl w-fit text-xs shadow-lg flex-wrap gap-y-1">
        {[
          { id: 'ALL', label: 'Все форматы' },
          { id: 'FULL_SCREEN', label: 'FULL SCREEN (4:3)', icon: RiTv2Line },
          { id: 'MODE32_PROMO', label: '50/50 PROMO (2:3)', icon: RiLayoutColumnLine },
          { id: 'DEFAULTS', label: '★ Дефолтные', icon: RiStarFill },
          { id: 'SCHEDULED', label: 'По расписанию', icon: RiCalendarLine }
        ].map((tab) => {
          const isActive = areaFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setAreaFilter(tab.id as any)}
              className={`relative px-3.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer flex items-center space-x-1.5 z-10 ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="playlistsFilterPill"
                  className="absolute inset-0 bg-blue-600 rounded-xl -z-10 shadow-sm shadow-blue-600/30"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: List on Left, Detail & Preview on Right */}
      {blocks.length === 0 ? (
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-12 text-center shadow-xl">
          <RiStackLine className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white mb-1">Шаблоны пока не созданы</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Создайте первый рекламный блок или динамическое слайдшоу для показа на экранах покупателей.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAdConfigOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center space-x-2 shadow-lg shadow-blue-600/25 border border-blue-400/30"
          >
            <RiAddLine className="w-4 h-4 text-white" />
            <span>Создать блок</span>
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Blocks List */}
          <div className="space-y-3">
            {filteredBlocks.map((b) => {
              const isSelected = selectedBlockId === b.id;
              const isFull = b.area === 'FULL_SCREEN';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBlockId(b.id)}
                  className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 shadow-md ${
                    isSelected 
                      ? 'bg-[#162033]' 
                      : 'bg-[#111928] border border-[#1e293b] hover:border-[#2a3c5a] hover:bg-[#131d2e]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeBlockBorder"
                      className="absolute inset-0 border-2 border-cyan-500 rounded-2xl -z-10 shadow-md shadow-cyan-500/10 pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isFull 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {isFull ? <RiTv2Line className="w-4 h-4" /> : <RiLayoutColumnLine className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{b.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.display_mode === 'STATIC' ? 'Баннер' : 'Слайдшоу'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                      isFull ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {isFull ? '1024×768' : '512×768'}
                    </span>
                  </div>

                  {/* Schedule & Default Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap my-2">
                    {b.is_default && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <RiStarFill className="w-2.5 h-2.5 text-amber-400" />
                        <span>Дефолтный</span>
                      </span>
                    )}
                    {b.schedule_status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <RiCalendarLine className="w-2.5 h-2.5 text-emerald-400" />
                        <span>В эфире{b.remaining_days !== null && b.remaining_days !== undefined ? ` (${b.remaining_days} дн.)` : ''}</span>
                      </span>
                    )}
                    {b.schedule_status === 'EXPIRED' && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <RiTimeLine className="w-2.5 h-2.5 text-rose-400" />
                        <span>Истёк</span>
                      </span>
                    )}
                    {b.schedule_status === 'SCHEDULED' && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <RiCalendarLine className="w-2.5 h-2.5 text-blue-400" />
                        <span>Запланирован</span>
                      </span>
                    )}
                    {!b.is_default && (!b.schedule_status || b.schedule_status === 'PERMANENT') && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono text-slate-400 bg-white/5 border border-white/10">
                        Бессрочно
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#1e293b]">
                    <span>Слайдов: <strong className="text-white font-semibold font-mono">{b.items_count}</strong></span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(b.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Active Block Detail & Preview */}
          <div className="lg:col-span-2">
            {blockDetail ? (
              <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 space-y-6 shadow-xl">
                
                {/* Header of detail */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1e293b] pb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-bold text-white">{blockDetail.name}</h2>
                      {blockDetail.is_default && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <RiStarFill className="w-3 h-3 text-amber-400" />
                          <span>Дефолтный</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Зона: <strong className="text-white">{blockDetail.area}</strong> • Режим: <strong className="text-white">{blockDetail.display_mode}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingBlock(blockDetail);
                        setAdConfigOpen(true);
                      }}
                      className="p-2 bg-[#162033] hover:bg-cyan-500/15 border border-[#1e293b] hover:border-cyan-500/30 rounded-xl text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                      title="Редактировать шаблон и расписание"
                    >
                      <RiEditLine className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => duplicateMutation.mutate(blockDetail.id)}
                      className="p-2 bg-[#162033] hover:bg-white/10 border border-[#1e293b] hover:border-white/20 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Дублировать шаблон"
                    >
                      <RiFileCopyLine className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Удалить рекламный блок "${blockDetail.name}"?`)) {
                          deleteMutation.mutate(blockDetail.id);
                        }
                      }}
                      className="p-2 bg-[#162033] hover:bg-rose-500/15 border border-[#1e293b] hover:border-rose-500/30 rounded-xl text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <RiDeleteBinLine className="w-4 h-4" />
                    </button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setEditingBlock(blockDetail || null);
                        setAdConfigOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center space-x-1.5 shadow-md shadow-blue-600/25 cursor-pointer"
                    >
                      <RiSendPlane2Line className="w-4 h-4 text-white" />
                      <span>Развернуть на кассы</span>
                    </motion.button>
                  </div>
                </div>

                {/* Schedule & Fallback Banner */}
                <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e1726] border-[#1e293b]">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      blockDetail.is_default
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : blockDetail.schedule_status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : blockDetail.schedule_status === 'EXPIRED'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {blockDetail.is_default ? <RiStarFill className="w-5 h-5 text-amber-400" /> : <RiCalendarLine className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-white font-bold text-xs">
                          {blockDetail.is_default
                            ? 'Дефолтный шаблон (Fallback по умолчанию)'
                            : blockDetail.schedule_type === 'DAYS'
                            ? `Временная акция на ${blockDetail.schedule_days || ''} дней`
                            : blockDetail.schedule_type === 'DATE_RANGE'
                            ? 'Календарное расписание показа'
                            : 'Постоянный показ (Бессрочно)'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                          blockDetail.is_default
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : blockDetail.schedule_status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : blockDetail.schedule_status === 'EXPIRED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}>
                          {blockDetail.is_default ? 'DEFAULT' : blockDetail.schedule_status || 'PERMANENT'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {blockDetail.is_default ? (
                          'На этот шаблон кассы автоматически переключаются после истечения любых временных акций.'
                        ) : blockDetail.valid_from && blockDetail.valid_to ? (
                          <>
                            Период показа: <strong className="text-white font-mono">{new Date(blockDetail.valid_from).toLocaleDateString('ru-RU')}</strong> — <strong className="text-white font-mono">{new Date(blockDetail.valid_to).toLocaleDateString('ru-RU')}</strong>
                            {blockDetail.remaining_days !== null && blockDetail.remaining_days !== undefined && (
                              <span className="ml-2 text-cyan-400 font-semibold font-mono">(Осталось: {blockDetail.remaining_days} дн.)</span>
                            )}
                            <span className="block text-slate-400 mt-0.5">
                              После окончания срока кассы автоматически переключатся на дефолтный шаблон зоны {blockDetail.area}.
                            </span>
                          </>
                        ) : (
                          'Бессрочный шаблон без ограничений по датам.'
                        )}
                      </div>
                    </div>
                  </div>

                  {!blockDetail.is_default && (
                    <button
                      onClick={() => setDefaultMutation.mutate(blockDetail.id)}
                      disabled={setDefaultMutation.isPending}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center space-x-1.5 transition-all self-start sm:self-auto cursor-pointer flex-shrink-0"
                      title="Сделать этот шаблон постоянным по умолчанию (Fallback)"
                    >
                      <RiStarFill className="w-3.5 h-3.5 text-amber-400" />
                      <span>Сделать дефолтным</span>
                    </button>
                  )}
                </div>

                {/* Slides Gallery of Block */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Слайды блока ({blockDetail.items.length})</span>
                    <span className="text-slate-400 font-mono">
                      Общая длительность цикла: {blockDetail.items.reduce((a, b) => a + b.duration_seconds, 0)} сек
                    </span>
                  </div>

                  {blockDetail.items.length === 0 ? (
                    <div className="p-8 bg-[#0b111e] border border-[#1e293b] rounded-xl text-center text-slate-400 text-xs">
                      В блоке нет добавленных слайдов
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {blockDetail.items.map((it) => (
                        <div key={it.id} className="bg-[#0b111e] border border-[#1e293b] rounded-xl p-3 space-y-2 hover:border-cyan-500/40 transition-all">
                          <div className="aspect-[4/3] bg-[#162033] rounded-lg overflow-hidden flex items-center justify-center relative border border-[#1e293b]">
                            {it.media ? (
                              <img
                                src={mediaApi.getThumbnailUrl(it.media.id)}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  if (it.media?.id) {
                                    (e.target as HTMLImageElement).src = mediaApi.getFileUrl(it.media.id);
                                  }
                                }}
                              />
                            ) : (
                              <RiMovie2Line className="w-6 h-6 text-slate-500" />
                            )}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 text-cyan-400 border border-white/10 backdrop-blur-md">
                              {it.duration_seconds} сек
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="font-semibold text-white truncate block" title={it.media?.original_name}>
                              {it.media?.original_name || 'Слайд'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              Порядок: #{it.order_index + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-400 text-xs shadow-xl">
                Выберите рекламный блок слева для просмотра деталей
              </div>
            )}
          </div>

        </div>
      )}

      {/* Ad Config / Deployment Modal */}
      {adConfigOpen && (
        <AdConfigModal
          cashiers={cashiers}
          branches={branches}
          regions={regions}
          initialBlock={editingBlock}
          onClose={() => {
            setAdConfigOpen(false);
            setEditingBlock(null);
          }}
          onDispatched={(batchId) => {
            setAdConfigOpen(false);
            setEditingBlock(null);
            setActiveBatchId(batchId);
          }}
        />
      )}

      {/* Live SSE Deployment Progress Modal */}
      {activeBatchId && (
        <DeploymentProgressModal
          batchId={activeBatchId}
          onClose={() => {
            setActiveBatchId(null);
            refetch();
          }}
        />
      )}

    </div>
  );
};
