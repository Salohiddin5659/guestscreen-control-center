import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  RiStackLine, 
  RiTv2Line, 
  RiLayoutColumnLine, 
  RiSendPlane2Line, 
  RiArrowRightLine 
} from 'react-icons/ri';
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
              <RiStackLine className="w-6 h-6 text-cyan-400" />
              Распределение контента
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 shadow-sm">
              Синхронизация {syncPercentage}%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Матрица назначения рекламных блоков FULL SCREEN и 50/50 по филиалам и кассам
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAdConfigOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center space-x-2 self-start sm:self-auto shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
        >
          <RiSendPlane2Line className="w-4 h-4 text-white" />
          <span>Назначить и применить рекламу</span>
        </motion.button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: FULL SCREEN */}
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#1e293b] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                  <RiTv2Line className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">FULL SCREEN (Зона ожидания)</h3>
                  <span className="text-[10px] text-slate-400 font-mono">1024 × 768 • Режим покоя</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#162033] text-slate-200 border border-[#1e293b]">
                {fullBlocks.length} активных шаблонов
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Полноэкранные рекламные слайды и баннеры, которые транслируются покупателям, когда касса свободна и нет активного чека.
            </p>

            <div className="space-y-2">
              {fullBlocks.slice(0, 3).map((b) => (
                <div key={b.id} className="p-3.5 bg-[#0b111e] border border-[#1e293b] rounded-xl flex items-center justify-between text-xs hover:border-[#2a3c5a] transition-all">
                  <div>
                    <span className="font-bold text-white block">{b.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Режим: {b.display_mode} • Слайдов: {b.items_count}
                    </span>
                  </div>
                </div>
              ))}
              {fullBlocks.length === 0 && (
                <div className="text-xs text-slate-400 italic py-2">Нет настроенных шаблонов Full Screen</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e293b] mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Охват: {cashiers.length} касс</span>
            <button
              onClick={() => setAdConfigOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold transition-all cursor-pointer"
            >
              <span>Настроить FULL блок</span>
              <RiArrowRightLine className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: 50/50 PROMO */}
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-[#1e293b] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <RiLayoutColumnLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">50/50 PROMO (Экран заказа)</h3>
                  <span className="text-[10px] text-slate-400 font-mono">512 × 768 • Режим набора чека</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#162033] text-slate-200 border border-[#1e293b]">
                {promoBlocks.length} активных шаблонов
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Рекламный блок на разделенном экране покупателя, отображающийся рядом с позициями текущего заказа (напитки, десерты, комбо).
            </p>

            <div className="space-y-2">
              {promoBlocks.slice(0, 3).map((b) => (
                <div key={b.id} className="p-3.5 bg-[#0b111e] border border-[#1e293b] rounded-xl flex items-center justify-between text-xs hover:border-[#2a3c5a] transition-all">
                  <div>
                    <span className="font-bold text-white block">{b.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Режим: {b.display_mode} • Слайдов: {b.items_count}
                    </span>
                  </div>
                </div>
              ))}
              {promoBlocks.length === 0 && (
                <div className="text-xs text-slate-400 italic py-2">Нет настроенных шаблонов 50/50 Promo</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e293b] mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Охват: {cashiers.length} касс</span>
            <button
              onClick={() => setAdConfigOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold transition-all cursor-pointer"
            >
              <span>Настроить 50/50 блок</span>
              <RiArrowRightLine className="w-4 h-4" />
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
