import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Monitor, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  ShieldCheck, 
  Send, 
  Activity, 
  Pencil 
} from 'lucide-react';
import { 
  Cashier, 
  Branch, 
  Region, 
  AdvertisingBlockListItem, 
  topologyApi, 
  publicationsApi, 
  ConnectionTestResult 
} from '../../api/client';

interface DeviceDetailModalProps {
  cashier: Cashier;
  branches: Branch[];
  regions: Region[];
  adBlocks: AdvertisingBlockListItem[];
  onClose: () => void;
  onConfigureAd: (cashierId: string) => void;
  onEdit?: (cashier: Cashier) => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  cashier,
  branches,
  regions,
  adBlocks,
  onClose,
  onConfigureAd,
  onEdit,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'deployments'>('info');
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  const branch = branches.find(b => b.id === cashier.branch_id);
  const region = branch ? regions.find(r => r.id === branch.region_id) : undefined;

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: () => topologyApi.testConnection(cashier.id),
    onSuccess: (res) => {
      setTestResult(res);
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
    },
    onError: (err: any) => {
      alert(`Ошибка проверки связи: ${err.message}`);
    }
  });

  // Load publication history
  const { data: publications = [] } = useQuery({
    queryKey: ['publications'],
    queryFn: () => publicationsApi.list(),
  });

  const isOnline = cashier.last_sync_status === 'SUCCESS' || cashier.last_sync_status === 'ONLINE';

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return 'Никогда';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Block names lookup
  const currentFullBlock = cashier.current_full_screen_block_id 
    ? adBlocks.find(b => b.id === cashier.current_full_screen_block_id) 
    : null;
  const desiredFullBlock = cashier.override_full_screen_block_id 
    ? adBlocks.find(b => b.id === cashier.override_full_screen_block_id) 
    : (branch?.override_full_screen_block_id ? adBlocks.find(b => b.id === branch.override_full_screen_block_id) : (region?.default_full_screen_block_id ? adBlocks.find(b => b.id === region.default_full_screen_block_id) : null));

  const currentPromoBlock = cashier.current_mode32_block_id 
    ? adBlocks.find(b => b.id === cashier.current_mode32_block_id) 
    : null;
  const desiredPromoBlock = cashier.override_mode32_block_id 
    ? adBlocks.find(b => b.id === cashier.override_mode32_block_id) 
    : (branch?.override_mode32_block_id ? adBlocks.find(b => b.id === branch.override_mode32_block_id) : (region?.default_mode32_block_id ? adBlocks.find(b => b.id === region.default_mode32_block_id) : null));

  const fullIsSync = (currentFullBlock?.id === desiredFullBlock?.id) || (!desiredFullBlock && !currentFullBlock);
  const promoIsSync = (currentPromoBlock?.id === desiredPromoBlock?.id) || (!desiredPromoBlock && !currentPromoBlock);

  return createPortal(
    <div className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isOnline ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-500 border border-white/10'
            }`}>
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white tracking-tight">{cashier.name}</h2>
                <span className="font-mono text-xs text-teal-300 font-bold glass-surface-l2 px-2.5 py-0.5 rounded-full border border-white/10">
                  {cashier.ip_address}:{cashier.ssh_port}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {branch?.name || 'Без филиала'} • {region?.name || 'Ташкент'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(cashier)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center space-x-1.5 transition-colors"
                title="Редактировать параметры кассы"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Редактировать</span>
              </button>
            )}

            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${testMutation.isPending ? 'animate-spin text-teal-300' : 'text-emerald-400'}`} />
              <span>{testMutation.isPending ? 'Проверка...' : 'SSH тест'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Test Result Banner */}
        {testResult && (
          <div className="border-b border-white/[0.08] bg-black/20 p-4 space-y-3">
            <div className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between ${
              testResult.online 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center space-x-2">
                {testResult.online ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                <span className="font-semibold">
                  {testResult.online 
                    ? `Связь в норме: отклик ${testResult.response_time_ms} ms. Терминал онлайн.`
                    : `Сбой проверки связи: ${testResult.error_message || 'Касса не отвечает'}`}
                </span>
              </div>
              <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded">✕</button>
            </div>

            {testResult.online && testResult.inspection && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="glass-surface-l2 p-2.5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">PID GuestScreen</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-teal-300 text-sm">{testResult.inspection.active_pid || '—'}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      LIVE
                    </span>
                  </div>
                </div>

                <div className="glass-surface-l2 p-2.5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Блокировка БД</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-emerald-400 text-xs">{testResult.inspection.lock_state || 'UNLOCKED'}</span>
                  </div>
                </div>

                <div className="glass-surface-l2 p-2.5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Разрешение</span>
                  <div className="font-mono text-white text-xs mt-0.5">
                    {testResult.inspection.resolution || '1024x768'} • 2 экр.
                  </div>
                </div>

                <div className="glass-surface-l2 p-2.5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Свободное место</span>
                  <div className="font-mono text-white text-xs mt-0.5">
                    {testResult.inspection.free_space_mb ? `${Math.round(testResult.inspection.free_space_mb / 1024)} GB` : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] px-6 bg-black/20">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'info'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Общая информация
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'content'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Контент и реклама
          </button>
          <button
            onClick={() => setActiveTab('deployments')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'deployments'
                ? 'border-teal-400 text-teal-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            История публикаций
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Status Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="glass-surface-l2 border border-white/10 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px] mb-1 font-medium">Статус связи</span>
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    {isOnline ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-400">В сети</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-slate-400">Не в сети</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="glass-surface-l2 border border-white/10 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px] mb-1 font-medium">GuestScreen</span>
                  <span className="font-mono font-bold text-sm text-white">
                    {cashier.guest_screen_version || '3.1.1.0'}
                  </span>
                </div>

                <div className="glass-surface-l2 border border-white/10 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px] mb-1 font-medium">Версия контента</span>
                  <span className="font-mono font-bold text-sm text-teal-300">
                    v{cashier.current_content_version || 1}
                  </span>
                </div>

                <div className="glass-surface-l2 border border-white/10 rounded-xl p-3">
                  <span className="text-slate-400 block text-[11px] mb-1 font-medium">SSH пароль</span>
                  <span className="font-semibold text-sm text-white flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {cashier.has_ssh_password ? 'Сохранен' : 'По умолчанию'}
                  </span>
                </div>
              </div>

              {/* Technical Information */}
              <div className="glass-surface-l2 border border-white/10 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-white text-xs border-b border-white/[0.08] pb-2 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-teal-300" />
                  <span>Сетевые и системные параметры</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 block font-medium">IP адрес:</span>
                    <span className="text-white font-mono font-bold">{cashier.ip_address}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Порт SSH:</span>
                    <span className="text-white font-mono">{cashier.ssh_port}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Филиал:</span>
                    <span className="text-white font-medium">{branch?.name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Регион:</span>
                    <span className="text-white font-medium">{region?.name || 'Ташкент'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Последняя синхронизация:</span>
                    <span className="text-slate-300 font-mono">{formatDateTime(cashier.last_seen_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Дата регистрации:</span>
                    <span className="text-slate-300 font-mono">{formatDateTime(cashier.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Соответствие контента (Current vs Desired)</h4>
                  <p className="text-[11px] text-slate-400">Сравнение отображаемого контента на кассе с целевым блоком</p>
                </div>

                <button
                  onClick={() => onConfigureAd(cashier.id)}
                  className="glass-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Назначить рекламу</span>
                </button>
              </div>

              {/* FULL SCREEN Comparison */}
              <div className="glass-surface-l2 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <Monitor className="w-4 h-4 text-teal-300" />
                    <span>FULL SCREEN (1024 × 768 • Режим покоя)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    fullIsSync ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {fullIsSync ? 'СИНХРОНИЗИРОВАНО' : 'ТРЕБУЕТСЯ ДЕПЛОЙ'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-surface-l3 p-3 rounded-lg border border-white/[0.08]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Текущий блок на кассе</span>
                    <div className="text-white font-bold text-sm">
                      {currentFullBlock ? currentFullBlock.name : 'По умолчанию'}
                    </div>
                    <span className="text-slate-400 text-[11px] block mt-1">
                      {currentFullBlock ? `Режим: ${currentFullBlock.display_mode} • v${currentFullBlock.version}` : 'Базовый промо-блок'}
                    </span>
                  </div>

                  <div className="glass-surface-l3 p-3 rounded-lg border border-white/[0.08]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Целевой назначенный блок</span>
                    <div className="text-teal-300 font-bold text-sm">
                      {desiredFullBlock ? desiredFullBlock.name : (currentFullBlock ? currentFullBlock.name : 'По умолчанию')}
                    </div>
                    <span className="text-slate-400 text-[11px] block mt-1">
                      {desiredFullBlock ? `Режим: ${desiredFullBlock.display_mode} • v${desiredFullBlock.version}` : 'Политика филиала'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 50/50 ORDER PROMO Comparison */}
              <div className="glass-surface-l2 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <div className="flex items-center space-x-2 font-bold text-white">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>50/50 PROMO (512 × 768 • Экран заказа)</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    promoIsSync ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {promoIsSync ? 'СИНХРОНИЗИРОВАНО' : 'ТРЕБУЕТСЯ ДЕПЛОЙ'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-surface-l3 p-3 rounded-lg border border-white/[0.08]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Текущий блок на кассе</span>
                    <div className="text-white font-bold text-sm">
                      {currentPromoBlock ? currentPromoBlock.name : 'По умолчанию'}
                    </div>
                    <span className="text-slate-400 text-[11px] block mt-1">
                      {currentPromoBlock ? `Режим: ${currentPromoBlock.display_mode} • v${currentPromoBlock.version}` : 'Базовое меню'}
                    </span>
                  </div>

                  <div className="glass-surface-l3 p-3 rounded-lg border border-white/[0.08]">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-semibold">Целевой назначенный блок</span>
                    <div className="text-emerald-400 font-bold text-sm">
                      {desiredPromoBlock ? desiredPromoBlock.name : (currentPromoBlock ? currentPromoBlock.name : 'По умолчанию')}
                    </div>
                    <span className="text-slate-400 text-[11px] block mt-1">
                      {desiredPromoBlock ? `Режим: ${desiredPromoBlock.display_mode} • v${desiredPromoBlock.version}` : 'Политика филиала'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deployments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Недавние пакеты публикаций</h4>
                <span className="text-xs text-slate-400">Всего пакетов: {publications.length}</span>
              </div>

              {publications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  История публикаций пока пуста
                </div>
              ) : (
                <div className="space-y-2">
                  {publications.slice(0, 5).map((pub) => (
                    <div key={pub.id} className="glass-surface-l2 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span>Пакет #{pub.id.substring(0, 8)}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded glass-surface-l3 text-teal-300 border border-white/10">
                            {pub.scope_type}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          Запущен: {formatDateTime(pub.started_at)} • Касс: {pub.total_cashiers} (Успешно: {pub.success_count}, Сбоев: {pub.failed_count})
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        pub.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'glass-surface-l2 text-slate-400'
                      }`}>
                        {pub.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/20 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono">
            ID: {cashier.id}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onConfigureAd(cashier.id)}
              className="glass-btn-primary px-4 py-2 rounded-xl font-bold flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Назначить рекламу</span>
            </button>
            <button
              onClick={onClose}
              className="glass-btn-secondary px-4 py-2 rounded-xl"
            >
              Закрыть
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
