import React, { useState, useEffect } from 'react';
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

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 inline-flex">
            <Check className="w-3 h-3 text-emerald-400" />
            УСПЕШНО
          </span>
        );
      case 'RUNNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent-500/15 text-accent-400 border border-accent-500/30 flex items-center gap-1.5 inline-flex">
            <Loader2 className="w-3 h-3 text-accent-400 animate-spin" />
            В ПРОЦЕССЕ
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5 inline-flex">
            <Clock className="w-3 h-3 text-indigo-400" />
            В ОЧЕРЕДИ
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5 inline-flex">
            <WifiOff className="w-3 h-3 text-slate-500" />
            ОФФЛАЙН
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 inline-flex">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            ОШИБКА
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-dark-750 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-850 border border-dark-750 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-750 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isFinished 
                ? (failed > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400') 
                : 'bg-accent-500/10 text-accent-400'
            }`}>
              {isFinished ? (
                failed > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">
                  {isFinished ? 'Публикация завершена' : 'Выполняется доставка рекламы на кассы...'}
                </h2>
                <span className="font-mono text-xs text-slate-400">
                  #{batchId.substring(0, 8)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Трансляция событий в реальном времени (SSE) • Область: {batch?.scope_type || 'КАССЫ'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-dark-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Summary Stats */}
        <div className="p-6 border-b border-dark-750 bg-dark-900/40 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Общий прогресс развертывания</span>
              <span className="text-white font-mono">{percent}%</span>
            </div>
            <div className="w-full h-2.5 bg-dark-800 rounded-full overflow-hidden flex">
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
            <div className="bg-dark-850 border border-dark-750 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Касс в пакете</span>
              <span className="font-mono font-bold text-white text-sm">{total}</span>
            </div>
            <div className="bg-dark-850 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="text-emerald-400 block text-[10px]">Успешно</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{success}</span>
            </div>
            <div className="bg-dark-850 border border-rose-500/20 p-2.5 rounded-xl">
              <span className="text-rose-400 block text-[10px]">Сбоев</span>
              <span className="font-mono font-bold text-rose-400 text-sm">{failed}</span>
            </div>
            <div className="bg-dark-850 border border-slate-700 p-2.5 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Оффлайн</span>
              <span className="font-mono font-bold text-slate-300 text-sm">{offline}</span>
            </div>
          </div>
        </div>

        {/* Cashier Jobs Table */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white">Статус по кассам</h4>
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

          <div className="border border-dark-750 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-900 border-b border-dark-750 text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Касса</th>
                  <th className="py-2.5 px-3">IP адрес</th>
                  <th className="py-2.5 px-3">Попытка</th>
                  <th className="py-2.5 px-3">Статус</th>
                  <th className="py-2.5 px-3 text-right">Результат</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-750/60 bg-dark-850/50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {job.cashier_name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {job.cashier_ip}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      #{job.attempt_count}
                    </td>
                    <td className="py-2.5 px-3">
                      {getJobStatusBadge(job.status)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {job.error_message ? (
                        <span className="text-rose-400 font-mono text-[10px] truncate max-w-[200px] block" title={job.error_message}>
                          {job.error_message}
                        </span>
                      ) : job.status === 'SUCCESS' ? (
                        <span className="text-emerald-400 font-mono text-[11px]">Сцена применена</span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Обработка...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-750 bg-dark-900/40 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            Статус пакета: {batch?.status || 'RUNNING'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-white font-bold bg-dark-800 hover:bg-dark-750 transition-colors"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
