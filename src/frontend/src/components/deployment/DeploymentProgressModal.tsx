import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Loader2, 
  Monitor, 
  RefreshCw,
  RotateCcw,
  WifiOff,
  Check
} from 'lucide-react';
import { publicationsApi, PublicationBatchDetail, PublicationJob } from '../../api/client';

interface DeploymentProgressModalProps {
  batchId: string;
  onClose: () => void;
}

export const DeploymentProgressModal: React.FC<DeploymentProgressModalProps> = ({
  batchId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [liveJobsMap, setLiveJobsMap] = useState<Record<string, Partial<PublicationJob>>>({});
  const [retrying, setRetrying] = useState(false);

  // Poll batch details from FastAPI GET /api/v1/publications/{batch_id}
  const { data: batchDetail, isLoading, refetch } = useQuery<PublicationBatchDetail>({
    queryKey: ['publication-batch', batchId],
    queryFn: () => publicationsApi.getBatch(batchId),
    refetchInterval: (query) => {
      const status = query.state.data?.batch?.status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'PARTIALLY_FAILED') {
        return false;
      }
      return 2000;
    },
  });

  // Subscribe to real-time Server-Sent Events (SSE) via FastAPI GET /api/v1/events/publications/{batch_id}
  useEffect(() => {
    if (!batchId) return;

    const unsubscribe = publicationsApi.subscribeEvents(batchId, (event) => {
      if (event.job_id || event.cashier_id) {
        const key = event.job_id || event.cashier_id;
        setLiveJobsMap((prev) => ({
          ...prev,
          [key]: {
            status: event.status,
            error_message: event.error_message,
          },
        }));
        refetch();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [batchId, refetch]);

  // Retry failed jobs mutation
  const retryMutation = useMutation({
    mutationFn: () => publicationsApi.retryFailed(batchId),
    onSuccess: (res) => {
      setRetrying(false);
      alert(res.message);
      refetch();
    },
    onError: (err: any) => {
      setRetrying(false);
      alert(`Ошибка повтора публикации: ${err.message}`);
    }
  });

  const batch = batchDetail?.batch;
  const rawJobs = batchDetail?.jobs || [];

  // Merge live SSE event updates into jobs list
  const jobs = rawJobs.map((j) => {
    const liveUpdate = liveJobsMap[j.id] || liveJobsMap[j.cashier_id];
    if (liveUpdate) {
      return { ...j, ...liveUpdate };
    }
    return j;
  });

  const total = batch?.total_cashiers || jobs.length || 1;
  const success = batch?.success_count ?? jobs.filter(j => j.status === 'SUCCESS').length;
  const awaiting = batch?.awaiting_restart_count ?? jobs.filter(j => j.status === 'PUBLISHED_AWAITING_RESTART' as any).length;
  const failed = batch?.failed_count ?? jobs.filter(j => j.status === 'FAILED').length;
  const offline = batch?.offline_count ?? jobs.filter(j => j.status === 'OFFLINE').length;
  const inProgress = jobs.filter(j => j.status === 'RUNNING' || j.status === 'PENDING').length;

  const percent = Math.min(100, Math.round(((success + awaiting) / total) * 100));
  const isFinished = batch?.status === 'COMPLETED' || batch?.status === 'FAILED' || batch?.status === 'PARTIALLY_FAILED' || (inProgress === 0 && !isLoading);

  const getJobStatusBadge = (job: PublicationJob) => {
    switch (job.status) {
      case 'SUCCESS':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 inline-flex">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Успешно
          </span>
        );
      case 'RUNNING':
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1.5 inline-flex">
            <Loader2 className="w-3.5 h-3.5 text-teal-300 animate-spin" />
            Выполняется
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1.5 inline-flex">
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            Оффлайн
          </span>
        );
      case 'FAILED':
        return (
          <div className="flex flex-col items-end">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 inline-flex">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Ошибка
            </span>
            {job.error_message && (
              <span className="text-rose-400/80 text-[10px] mt-0.5 max-w-[220px] truncate" title={job.error_message}>
                {job.error_message}
              </span>
            )}
          </div>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold glass-surface-l2 text-slate-300">
            {job.status}
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isFinished 
                ? (failed > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400') 
                : 'bg-teal-500/10 text-teal-300'
            }`}>
              {isFinished ? (
                failed > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isFinished 
                  ? (failed > 0 ? 'Завершено с ошибками' : 'Успешно') 
                  : 'Выполняется'}
              </h2>
              <p className="text-xs text-slate-400">
                {isFinished
                  ? (failed > 0 
                      ? `Обновлено: ${success} из ${total} касс` 
                      : 'Рекламный шаблон успешно применен на всех кассах')
                  : 'Применение рекламы на кассы...'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Summary Stats */}
        <div className="p-6 border-b border-white/[0.08] bg-black/20 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Общий прогресс</span>
              <span className="text-white font-mono">{percent}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/[0.08] rounded-full overflow-hidden flex">
              <div 
                style={{ width: `${(success / total) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
              />
              <div 
                style={{ width: `${(awaiting / total) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
              />
              <div 
                style={{ width: `${(failed / total) * 100}%` }}
                className="bg-rose-500 transition-all duration-500"
              />
              <div 
                style={{ width: `${(offline / total) * 100}%` }}
                className="bg-slate-600 transition-all duration-500"
              />
            </div>
          </div>

          {/* Counts row */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="glass-surface-l2 border border-white/10 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Всего касс</span>
              <span className="font-mono font-bold text-white text-sm">{total}</span>
            </div>
            <div className="glass-surface-l2 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="text-emerald-400 block text-[10px]">Успешно</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{success}</span>
            </div>
            <div className="glass-surface-l2 border border-rose-500/20 p-2.5 rounded-xl">
              <span className="text-rose-400 block text-[10px]">Ошибок</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{failed}</span>
            </div>
            <div className="glass-surface-l2 border border-white/10 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Оффлайн</span>
              <span className="font-mono font-bold text-slate-300 text-sm">{offline}</span>
            </div>
          </div>
        </div>

        {/* Cashier Jobs Table */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white">Кассы</h4>
            {failed > 0 && isFinished && (
              <button
                onClick={() => {
                  setRetrying(true);
                  retryMutation.mutate();
                }}
                disabled={retrying}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>Повторить для неудавшихся ({failed})</span>
              </button>
            )}
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-white/[0.08] text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-4">Касса</th>
                  <th className="py-2.5 px-4">IP адрес</th>
                  <th className="py-2.5 px-4 text-right">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {job.cashier_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {job.cashier_ip}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {getJobStatusBadge(job)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/20 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Статус: <strong className={isFinished ? (failed > 0 ? 'text-amber-400' : 'text-emerald-400') : 'text-teal-300'}>
              {isFinished ? (failed > 0 ? 'Завершено с ошибками' : 'Успешно') : 'Выполняется'}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="glass-btn-secondary px-5 py-2 rounded-xl font-bold"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
