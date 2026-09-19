import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Film, 
  Plus, 
  Trash2, 
  Copy, 
  Send, 
  Monitor, 
  Columns, 
  Layers,
  Pencil
} from 'lucide-react';
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
  const [areaFilter, setAreaFilter] = useState<'ALL' | 'FULL_SCREEN' | 'MODE32_PROMO'>('ALL');
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

  const filteredBlocks = blocks.filter((b) => {
    if (areaFilter !== 'ALL' && b.area !== areaFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Рекламные шаблоны и плейлисты</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold glass-surface-l1 glass-specular-edge text-[#A9DFD8] border border-white/10 shadow-sm">
              {blocks.length} блоков
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Управление шаблонами рекламных блоков, таймингами слайдов и быстрая публикация на кассы
          </p>
        </div>

        <button
          onClick={() => setAdConfigOpen(true)}
          className="glass-btn-primary text-xs flex items-center space-x-2 self-start sm:self-auto shadow-lg shadow-[#A9DFD8]/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Создать рекламный блок</span>
        </button>
      </div>

      {/* Area Filter Tabs */}
      <div className="flex items-center space-x-2 glass-surface-l1 glass-specular-edge border border-white/10 p-1.5 rounded-2xl w-fit text-xs shadow-lg">
        <button
          onClick={() => setAreaFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
            areaFilter === 'ALL' ? 'glass-active-capsule font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Все форматы
        </button>
        <button
          onClick={() => setAreaFilter('FULL_SCREEN')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5 ${
            areaFilter === 'FULL_SCREEN' ? 'glass-active-capsule font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>FULL SCREEN (4:3)</span>
        </button>
        <button
          onClick={() => setAreaFilter('MODE32_PROMO')}
          className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5 ${
            areaFilter === 'MODE32_PROMO' ? 'glass-active-capsule font-bold shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>50/50 PROMO (2:3)</span>
        </button>
      </div>

      {/* Main Grid: List on Left, Detail & Preview on Right */}
      {blocks.length === 0 ? (
        <div className="glass-surface-l2 glass-specular-edge rounded-3xl p-12 text-center shadow-xl">
          <Layers className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white mb-1">Шаблоны пока не созданы</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Создайте первый рекламный блок или динамическое слайдшоу для показа на экранах покупателей.
          </p>
          <button
            onClick={() => setAdConfigOpen(true)}
            className="glass-btn-primary text-xs inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Создать блок</span>
          </button>
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
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-300 shadow-lg ${
                    isSelected 
                      ? 'glass-surface-l2 border border-[#A9DFD8]/60 ring-1 ring-[#A9DFD8]/30 scale-[1.01]' 
                      : 'glass-surface-l1 glass-specular-edge border border-white/10 hover:border-[#A9DFD8]/40 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isFull 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                          : 'bg-[#A9DFD8]/15 text-[#A9DFD8] border border-[#A9DFD8]/30 shadow-[0_0_10px_rgba(169,223,216,0.15)]'
                      }`}>
                        {isFull ? <Monitor className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{b.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.display_mode === 'STATIC' ? 'Баннер' : 'Слайдшоу'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                      isFull ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-[#A9DFD8]/15 text-[#A9DFD8] border border-[#A9DFD8]/30'
                    }`}>
                      {isFull ? '1024×768' : '512×768'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-white/[0.08] mt-2">
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
              <div className="glass-surface-l2 glass-specular-edge rounded-3xl p-6 space-y-6 shadow-xl">
                
                {/* Header of detail */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-bold text-white">{blockDetail.name}</h2>
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
                      className="p-2 bg-white/5 hover:bg-[#A9DFD8]/15 border border-white/10 hover:border-[#A9DFD8]/30 rounded-xl text-slate-300 hover:text-[#A9DFD8] transition-colors"
                      title="Редактировать шаблон"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => duplicateMutation.mutate(blockDetail.id)}
                      className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-slate-300 hover:text-white transition-colors"
                      title="Дублировать шаблон"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Удалить рекламный блок "${blockDetail.name}"?`)) {
                          deleteMutation.mutate(blockDetail.id);
                        }
                      }}
                      className="p-2 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingBlock(blockDetail || null);
                        setAdConfigOpen(true);
                      }}
                      className="glass-btn-primary text-xs flex items-center space-x-1.5 shadow-md shadow-[#A9DFD8]/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Развернуть на кассы</span>
                    </button>
                  </div>
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
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center text-slate-400 text-xs">
                      В блоке нет добавленных слайдов
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {blockDetail.items.map((it) => (
                        <div key={it.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2 hover:border-[#A9DFD8]/40 transition-all">
                          <div className="aspect-[4/3] bg-white/5 rounded-xl overflow-hidden flex items-center justify-center relative border border-white/10">
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
                              <Film className="w-6 h-6 text-slate-500" />
                            )}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 text-[#A9DFD8] border border-white/15 backdrop-blur-md">
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
              <div className="glass-surface-l2 glass-specular-edge rounded-3xl p-12 text-center text-slate-400 text-xs shadow-xl">
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
