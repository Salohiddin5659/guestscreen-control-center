import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Radio, 
  X,
  Play
} from 'lucide-react';
import { apiRequest, publicationApi } from '../api/client';

export const Publications: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedBatchId = searchParams.get('batch');

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [scopeType, setScopeType] = useState<'REGION' | 'BRANCH' | 'CUSTOM_CASHIERS'>('BRANCH');
  const [targetId, setTargetId] = useState<string>('');

  // Load publication batches
  const { data: batches } = useQuery({
    queryKey: ['publications'],
    queryFn: () => apiRequest('/publications'),
    refetchInterval: 5000,
  });

  // Select active batch
  const activeBatchId = selectedBatchId || (batches && batches.length > 0 ? batches[0].id : null);

  // Load batch detail
  const { data: batchDetail } = useQuery({
    queryKey: ['publication-detail', activeBatchId],
    queryFn: () => apiRequest(`/publications/${activeBatchId}`),
    enabled: !!activeBatchId,
    refetchInterval: 3000,
  });

  // Load blocks, regions, branches for dispatch modal
  const { data: blocks } = useQuery({ queryKey: ['advertising-blocks'], queryFn: () => apiRequest('/advertising-blocks') });
  const { data: regions } = useQuery({ queryKey: ['regions'], queryFn: () => apiRequest('/regions') });
  const { data: branches } = useQuery({ queryKey: ['branches'], queryFn: () => apiRequest('/branches') });
  const { data: cashiers } = useQuery({ queryKey: ['cashiers'], queryFn: () => apiRequest('/cashiers') });

  // Connect SSE for active batch
  useEffect(() => {
    if (!activeBatchId) return;

    const eventSource = new EventSource(`/api/v1/events/publications/${activeBatchId}`);
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'job_update') {
          queryClient.invalidateQueries({ queryKey: ['publication-detail', activeBatchId] });
          queryClient.invalidateQueries({ queryKey: ['publications'] });
        }
      } catch (err) {
        // Ping or ignore
      }
    };

    return () => {
      eventSource.close();
    };
  }, [activeBatchId, queryClient]);

  // Dispatch Mutation
  const dispatchMutation = useMutation({
    mutationFn: (payload: any) => apiRequest('/publications', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (data) => {
      setDispatchModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      setSearchParams({ batch: data.batch_id });
    },
    onError: (err: any) => {
      alert(err.message || 'Ошибка запуска публикации');
    }
  });

  // Retry Failed Only Mutation
  const retryFailedMutation = useMutation({
    mutationFn: (batchId: string) => publicationApi.retryFailed(batchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publication-detail', activeBatchId] });
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      alert('Повторная доставка на сбойные кассы запущена из исходного неизменяемого снимка.');
    },
    onError: (err: any) => {
      alert(err.message || 'Ошибка повторного запуска');
    }
  });

  const handleStartDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockId || !targetId) {
      alert('Выберите блок и цель для публикации.');
      return;
    }

    dispatchMutation.mutate({
      advertising_block_id: selectedBlockId,
      scope_type: scopeType,
      scope_target_ids: [targetId],
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Успешно</span>;
      case 'PUBLISHED_AWAITING_RESTART':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Ожидает перезапуска</span>;
      case 'OFFLINE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><Radio className="w-3 h-3 mr-1" /> Недоступна</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><AlertTriangle className="w-3 h-3 mr-1" /> Ошибка</span>;
      case 'RUNNING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 animate-pulse"><Play className="w-3 h-3 mr-1" /> Выполняется</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">В очереди</span>;
    }
  };

  const batch = batchDetail?.batch;
  const jobs = batchDetail?.jobs || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Мониторинг публикаций</h2>
          <p className="text-sm text-slate-500 mt-1">Оркестрация доставки баннеров и хирургическое обновление gs.db</p>
        </div>
        <button
          onClick={() => setDispatchModalOpen(true)}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Новая публикация</span>
        </button>
      </div>

      {/* Batches Selector Pills */}
      {batches && batches.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {batches.map((b: any) => (
            <button
              key={b.id}
              onClick={() => setSearchParams({ batch: b.id })}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap flex items-center space-x-2 ${
                b.id === activeBatchId
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Пакет #{b.id.slice(0, 8)}</span>
              <span className="opacity-75">({b.total_cashiers} касс)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                b.status === 'PARTIAL' ? 'bg-amber-400 text-amber-950 font-bold' :
                b.status === 'COMPLETED' || b.status === 'SUCCESS' ? 'bg-emerald-400 text-emerald-950 font-semibold' :
                b.status === 'FAILED' ? 'bg-rose-400 text-rose-950 font-semibold' : 'bg-slate-300 text-slate-800'
              }`}>
                {b.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {batch ? (
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-slate-900">Пакет #{batch.id.slice(0, 8)}</h3>
                  <span className="text-xs px-2.5 py-0.5 bg-slate-100 text-slate-700 font-mono rounded-full">
                    {batch.scope_type}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    batch.status === 'COMPLETED' || batch.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : batch.status === 'PARTIAL'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold'
                      : batch.status === 'FAILED'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-indigo-50 text-indigo-700 animate-pulse'
                  }`}>
                    {batch.status === 'PARTIAL' ? 'ЧАСТИЧНО (PARTIAL)' : batch.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Запущен: {new Date(batch.created_at).toLocaleString()}
                </p>
              </div>

              {(batch.failed_count > 0 || batch.offline_count > 0 || batch.status === 'PARTIAL') && (
                <button
                  onClick={() => retryFailedMutation.mutate(batch.id)}
                  disabled={retryFailedMutation.isPending}
                  className="inline-flex items-center px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold transition space-x-1.5 shadow-2xs"
                  title="Повторить публикацию только на сбойных кассах из неизменяемого снимка"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${retryFailedMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>Повторить сбойные кассы ({batch.failed_count + batch.offline_count})</span>
                </button>
              )}
            </div>

            {/* Counters Bar */}
            <div className="grid grid-cols-4 gap-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-xs text-slate-500">Всего целевых касс</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{batch.total_cashiers}</p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <span className="text-xs text-emerald-700">Успешно доставлено</span>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">{batch.success_count}</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-xs text-amber-700">Ожидают ночного перезапуска</span>
                <p className="text-xl font-bold text-amber-800 mt-0.5">{batch.awaiting_restart_count}</p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <span className="text-xs text-rose-700">Ошибки / Офлайн</span>
                <p className="text-xl font-bold text-rose-800 mt-0.5">{batch.failed_count + batch.offline_count}</p>
              </div>
            </div>
          </div>

          {/* Cashier Jobs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h4 className="font-semibold text-slate-900 text-sm">Статус выполнения по кассам</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Имя кассы</th>
                    <th className="px-6 py-3">IP-адрес</th>
                    <th className="px-6 py-3">Статус</th>
                    <th className="px-6 py-3">Попыток</th>
                    <th className="px-6 py-3">Диагностика</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((j: any) => (
                    <tr key={j.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{j.cashier_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{j.cashier_ip}</td>
                      <td className="px-6 py-4">{getStatusBadge(j.status)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{j.attempt_count}</td>
                      <td className="px-6 py-4">
                        {j.error_message ? (
                          <span className="text-xs text-rose-600 truncate max-w-xs block font-mono" title={j.error_message}>
                            {j.error_message}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
          Нет активных публикаций. Нажмите "Новая публикация" для запуска.
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg">Запуск публикации контента</h3>
              <button onClick={() => setDispatchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartDispatch} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Рекламный блок *
                </label>
                <select
                  required
                  value={selectedBlockId}
                  onChange={(e) => setSelectedBlockId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Выберите рекламный блок --</option>
                  {blocks?.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.area} • {b.display_mode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Область публикации (Scope)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setScopeType('BRANCH'); setTargetId(''); }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                      scopeType === 'BRANCH' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Филиал
                  </button>
                  <button
                    type="button"
                    onClick={() => { setScopeType('REGION'); setTargetId(''); }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                      scopeType === 'REGION' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Регион
                  </button>
                  <button
                    type="button"
                    onClick={() => { setScopeType('CUSTOM_CASHIERS'); setTargetId(''); }}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                      scopeType === 'CUSTOM_CASHIERS' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Касса (Адресная)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Целевой объект *
                </label>
                {scopeType === 'BRANCH' && (
                  <select
                    required
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">-- Выберите филиал --</option>
                    {branches?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                )}
                {scopeType === 'REGION' && (
                  <select
                    required
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">-- Выберите регион --</option>
                    {regions?.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                )}
                {scopeType === 'CUSTOM_CASHIERS' && (
                  <select
                    required
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">-- Выберите конкретную кассу --</option>
                    {cashiers?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.ip_address})</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={dispatchMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50 space-x-2"
                >
                  {dispatchMutation.isPending ? 'Запуск...' : 'Опубликовать сейчас'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
