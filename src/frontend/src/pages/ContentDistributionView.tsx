import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Layers, 
  Monitor, 
  Columns, 
  Send, 
  ArrowRight
} from 'lucide-react';
import { 
  topologyApi, 
  advertisingApi 
} from '../api/client';
import { AdConfigModal } from '../components/config/AdConfigModal';
import { DeploymentProgressModal } from '../components/deployment/DeploymentProgressModal';

export const ContentDistributionView: React.FC = () => {
  const [adConfigOpen, setAdConfigOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

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

  const { data: adBlocks = [] } = useQuery({
    queryKey: ['advertising-blocks'],
    queryFn: () => advertisingApi.list(),
  });

  const fullBlocks = adBlocks.filter(b => b.area === 'FULL_SCREEN');
  const promoBlocks = adBlocks.filter(b => b.area === 'MODE32_PROMO');

  const inSyncCashiers = cashiers.filter(c => c.last_sync_status === 'SUCCESS' || c.last_sync_status === 'ONLINE').length;
  const syncPercentage = cashiers.length > 0 ? Math.round((inSyncCashiers / cashiers.length) * 100) : 100;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-[#A9DFD8]" />
              Распределение контента
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#A9DFD8]/15 text-[#A9DFD8] border border-[#A9DFD8]/30">
              Синхронизация {syncPercentage}%
            </span>
          </div>
          <p className="text-xs text-[#87888C] mt-1">
            Матрица назначения рекламных блоков FULL SCREEN и 50/50 по филиалам и кассам
          </p>
        </div>

        <button
          onClick={() => setAdConfigOpen(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8fd0c8] shadow-lg shadow-[#A9DFD8]/20 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Назначить и применить рекламу</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: FULL SCREEN */}
        <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#2C2D3A] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#A9DFD8]/10 text-[#A9DFD8] flex items-center justify-center">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">FULL SCREEN (Зона ожидания)</h3>
                  <span className="text-[10px] text-[#87888C] font-mono">1024 × 768 • Режим покоя</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#171821] text-white border border-[#2C2D3A]">
                {fullBlocks.length} активных шаблонов
              </span>
            </div>

            <p className="text-xs text-[#87888C] mb-4 leading-relaxed">
              Полноэкранные рекламные слайды и баннеры, которые транслируются покупателям, когда касса свободна и нет активного чека.
            </p>

            <div className="space-y-2">
              {fullBlocks.slice(0, 3).map((b) => (
                <div key={b.id} className="p-3 bg-[#171821] border border-[#2C2D3A] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{b.name}</span>
                    <span className="text-[10px] text-[#87888C] font-mono">
                      Режим: {b.display_mode} • Слайдов: {b.items_count}
                    </span>
                  </div>
                
                </div>
              ))}
              {fullBlocks.length === 0 && (
                <div className="text-xs text-[#87888C] italic py-2">Нет настроенных шаблонов Full Screen</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#2C2D3A] mt-4 flex items-center justify-between text-xs">
            <span className="text-[#87888C]">Охват: {cashiers.length} касс</span>
            <button
              onClick={() => setAdConfigOpen(true)}
              className="text-[#A9DFD8] hover:underline flex items-center space-x-1 font-semibold"
            >
              <span>Настроить FULL блок</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: 50/50 PROMO */}
        <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#2C2D3A] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#A9DFD8]/10 text-[#A9DFD8] flex items-center justify-center">
                  <Columns className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">50/50 PROMO (Экран заказа)</h3>
                  <span className="text-[10px] text-[#87888C] font-mono">512 × 768 • Режим набора чека</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#171821] text-white border border-[#2C2D3A]">
                {promoBlocks.length} активных шаблонов
              </span>
            </div>

            <p className="text-xs text-[#87888C] mb-4 leading-relaxed">
              Рекламный блок на разделенном экране покупателя, отображающийся рядом с позициями текущего заказа (напитки, десерты, комбо).
            </p>

            <div className="space-y-2">
              {promoBlocks.slice(0, 3).map((b) => (
                <div key={b.id} className="p-3 bg-[#171821] border border-[#2C2D3A] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{b.name}</span>
                    <span className="text-[10px] text-[#87888C] font-mono">
                      Режим: {b.display_mode} • Слайдов: {b.items_count}
                    </span>
                  </div>
                
                </div>
              ))}
              {promoBlocks.length === 0 && (
                <div className="text-xs text-[#87888C] italic py-2">Нет настроенных шаблонов 50/50 Promo</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#2C2D3A] mt-4 flex items-center justify-between text-xs">
            <span className="text-[#87888C]">Охват: {cashiers.length} касс</span>
            <button
              onClick={() => setAdConfigOpen(true)}
              className="text-[#A9DFD8] hover:underline flex items-center space-x-1 font-semibold"
            >
              <span>Настроить 50/50 блок</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Ad Config & Deployment Modals */}
      {adConfigOpen && (
        <AdConfigModal
          cashiers={cashiers}
          branches={branches}
          regions={regions}
          onClose={() => setAdConfigOpen(false)}
          onDispatched={(batchId: string) => {
            setAdConfigOpen(false);
            setActiveBatchId(batchId);
          }}
        />
      )}

      {activeBatchId && (
        <DeploymentProgressModal
          batchId={activeBatchId}
          onClose={() => setActiveBatchId(null)}
        />
      )}

    </div>
  );
};
