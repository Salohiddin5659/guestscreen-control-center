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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#21222D] text-[#A9DFD8] border border-[#2C2D3A]">
              {blocks.length} блоков
            </span>
          </div>
          <p className="text-xs text-[#87888C] mt-1">
            Управление шаблонами рекламных блоков, таймингами слайдов и быстрая публикация на кассы
          </p>
        </div>

        <button
          onClick={() => setAdConfigOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] shadow-lg shadow-[#A9DFD8]/20 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Создать рекламный блок</span>
        </button>
      </div>

      {/* Area Filter Tabs */}
      <div className="flex items-center space-x-2 bg-[#21222D] border border-[#2C2D3A] p-1.5 rounded-xl w-fit text-xs shadow-xl">
        <button
          onClick={() => setAreaFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
            areaFilter === 'ALL' ? 'bg-[#A9DFD8] text-[#171821] font-bold shadow-sm' : 'text-[#87888C] hover:text-white'
          }`}
        >
          Все форматы
        </button>
        <button
          onClick={() => setAreaFilter('FULL_SCREEN')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
            areaFilter === 'FULL_SCREEN' ? 'bg-[#A9DFD8] text-[#171821] font-bold shadow-sm' : 'text-[#87888C] hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>FULL SCREEN (4:3)</span>
        </button>
        <button
          onClick={() => setAreaFilter('MODE32_PROMO')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
            areaFilter === 'MODE32_PROMO' ? 'bg-[#A9DFD8] text-[#171821] font-bold shadow-sm' : 'text-[#87888C] hover:text-white'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>50/50 PROMO (2:3)</span>
        </button>
      </div>

      {/* Main Grid: List on Left, Detail & Preview on Right */}
      {blocks.length === 0 ? (
        <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-12 text-center shadow-xl">
          <Layers className="w-12 h-12 text-[#737791] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white mb-1">Шаблоны пока не созданы</h3>
          <p className="text-xs text-[#87888C] max-w-sm mx-auto mb-4">
            Создайте первый рекламный блок или динамическое слайдшоу для показа на экранах покупателей.
          </p>
          <button
            onClick={() => setAdConfigOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] inline-flex items-center space-x-2 shadow-sm"
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
                  className={`cursor-pointer bg-[#21222D] border rounded-2xl p-4 transition-all shadow-xl ${
                    isSelected 
                      ? 'border-[#A9DFD8] ring-1 ring-[#A9DFD8]/40 bg-[#282A37]' 
                      : 'border-[#2C2D3A] hover:border-[#A9DFD8]/40'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isFull ? 'bg-[#05C168]/15 text-[#05C168] border border-[#05C168]/30' : 'bg-[#A9DFD8]/15 text-[#A9DFD8] border border-[#A9DFD8]/30'
                      }`}>
                        {isFull ? <Monitor className="w-4 h-4" /> : <Columns className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs">{b.name}</h4>
                        <span className="text-[10px] text-[#87888C] font-mono">
                          {b.display_mode === 'STATIC' ? 'Баннер' : 'Слайдшоу'}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono ${
                      isFull ? 'bg-[#05C168]/15 text-[#05C168] border border-[#05C168]/30' : 'bg-[#A9DFD8]/15 text-[#A9DFD8] border border-[#A9DFD8]/30'
                    }`}>
                      {isFull ? '1024×768' : '512×768'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#87888C] pt-2.5 border-t border-[#2C2D3A]/60 mt-2">
                    <span>Слайдов: <strong className="text-white font-semibold font-mono">{b.items_count}</strong></span>
                    <span className="text-[10px] text-[#737791] font-mono">
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
              <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-6 space-y-6 shadow-xl">
                
                {/* Header of detail */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2C2D3A] pb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h2 className="text-lg font-bold text-white">{blockDetail.name}</h2>
                    </div>
                    <p className="text-xs text-[#87888C] mt-0.5">
                      Зона: <strong className="text-white">{blockDetail.area}</strong> • Режим: <strong className="text-white">{blockDetail.display_mode}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingBlock(blockDetail);
                        setAdConfigOpen(true);
                      }}
                      className="p-2 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-xl text-[#87888C] hover:text-[#A9DFD8] transition-colors"
                      title="Редактировать шаблон"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => duplicateMutation.mutate(blockDetail.id)}
                      className="p-2 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-xl text-[#87888C] hover:text-white transition-colors"
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
                      className="p-2 bg-[#171821] hover:bg-[#FF5B5B]/15 border border-[#2C2D3A] hover:border-[#FF5B5B]/30 rounded-xl text-[#737791] hover:text-[#FF5B5B] transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingBlock(blockDetail || null);
                        setAdConfigOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] shadow-sm flex items-center space-x-1.5"
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
                    <span className="text-[#87888C] font-mono">
                      Общая длительность цикла: {blockDetail.items.reduce((a, b) => a + b.duration_seconds, 0)} сек
                    </span>
                  </div>

                  {blockDetail.items.length === 0 ? (
                    <div className="p-8 bg-[#171821] border border-[#2C2D3A] rounded-xl text-center text-[#737791] text-xs">
                      В блоке нет добавленных слайдов
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {blockDetail.items.map((it) => (
                        <div key={it.id} className="bg-[#171821] border border-[#2C2D3A] rounded-xl p-3 space-y-2 hover:border-[#A9DFD8]/40 transition-all">
                          <div className="aspect-[4/3] bg-[#21222D] rounded-lg overflow-hidden flex items-center justify-center relative border border-[#2C2D3A]">
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
                              <Film className="w-6 h-6 text-[#737791]" />
                            )}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#171821]/80 text-[#A9DFD8] border border-[#2C2D3A] backdrop-blur-xs">
                              {it.duration_seconds} сек
                            </div>
                          </div>

                          <div className="text-xs">
                            <span className="font-semibold text-white truncate block" title={it.media?.original_name}>
                              {it.media?.original_name || 'Слайд'}
                            </span>
                            <span className="text-[10px] text-[#737791] font-mono block">
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
              <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-12 text-center text-[#737791] text-xs shadow-xl">
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
