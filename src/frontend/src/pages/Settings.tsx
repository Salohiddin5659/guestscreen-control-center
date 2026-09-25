import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  RiSave3Line, 
  RiCheckboxCircleLine, 
  RiServerLine, 
  RiCpuLine, 
  RiHardDrive2Line, 
  RiEqualizerLine 
} from 'react-icons/ri';
import { settingsApi, getCurrentUserFromStorage } from '../api/client';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUserFromStorage();
  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isPrivileged = roleUpper === 'ADMINISTRATOR' || roleUpper === 'ADMIN' || roleUpper === 'SUPERVISOR';

  useEffect(() => {
    if (!isPrivileged) {
      navigate('/devices', { replace: true });
    }
  }, [isPrivileged, navigate]);

  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => settingsApi.get(),
    enabled: isPrivileged,
  });

  const [workerConcurrency, setWorkerConcurrency] = useState(15);
  const [maxConcurrentPerBranch, setMaxConcurrentPerBranch] = useState(2);
  const [sshConnectTimeout, setSshConnectTimeout] = useState(10);
  const [sshCommandTimeout, setSshCommandTimeout] = useState(45);
  const [sftpTimeout, setSftpTimeout] = useState(60);
  const [minioRetention, setMinioRetention] = useState(30);
  const [backupRetention, setBackupRetention] = useState(7);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    if (settings) {
      setWorkerConcurrency(settings.worker_concurrency);
      setMaxConcurrentPerBranch(settings.max_concurrent_per_branch);
      setSshConnectTimeout(settings.ssh_connect_timeout_seconds);
      setSshCommandTimeout(settings.ssh_command_timeout_seconds);
      setSftpTimeout(settings.sftp_timeout_seconds);
      setMinioRetention(settings.minio_media_retention_days);
      setBackupRetention(settings.cashier_backup_retention_days);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => settingsApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    },
    onError: (err: any) => {
      alert(`Ошибка сохранения настроек: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      worker_concurrency: workerConcurrency,
      max_concurrent_per_branch: maxConcurrentPerBranch,
      ssh_connect_timeout_seconds: sshConnectTimeout,
      ssh_command_timeout_seconds: sshCommandTimeout,
      sftp_timeout_seconds: sftpTimeout,
      minio_media_retention_days: minioRetention,
      cashier_backup_retention_days: backupRetention,
    });
  };

  if (!isPrivileged) {
    return null;
  }

  return (
    <div className="max-w-4xl space-y-6 text-xs">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <RiEqualizerLine className="w-6 h-6 text-cyan-400" />
          Параметры и настройки
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Конфигурация параллелизма оркестратора публикаций, таймаутов SSH/SFTP и политик ротации
        </p>
      </div>

      {savedToast && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-2 shadow-lg"
        >
          <RiCheckboxCircleLine className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>Системные настройки успешно сохранены в базе данных и применены к рабочему пулу.</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Concurrency and Worker Pool */}
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 text-white font-bold text-sm border-b border-[#1e293b] pb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <RiCpuLine className="w-5 h-5" />
            </div>
            <span>Оркестратор параллельной доставки (Worker Pool)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white block mb-1 font-semibold">Общий пул воркеров (Worker Concurrency)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={workerConcurrency}
                onChange={(e) => setWorkerConcurrency(Number(e.target.value))}
                className="glass-input w-full font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Одновременных касс при публикации (рекомендуется 2-4)</span>
            </div>

            <div>
              <label className="text-white block mb-1 font-semibold">Лимит на филиал (Max Per Branch)</label>
              <input
                type="number"
                min={1}
                max={4}
                value={maxConcurrentPerBranch}
                onChange={(e) => setMaxConcurrentPerBranch(Number(e.target.value))}
                className="glass-input w-full font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Защита от перегрузки локальной сети филиала (1-4)</span>
            </div>
          </div>
        </div>

        {/* SSH and Network Timeouts */}
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 text-white font-bold text-sm border-b border-[#1e293b] pb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <RiServerLine className="w-5 h-5" />
            </div>
            <span>Сетевые протоколы и таймауты SSH / SFTP</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white block mb-1 font-semibold">Таймаут подключения SSH (сек)</label>
              <input
                type="number"
                min={3}
                max={60}
                value={sshConnectTimeout}
                onChange={(e) => setSshConnectTimeout(Number(e.target.value))}
                className="glass-input w-full font-mono"
              />
            </div>

            <div>
              <label className="text-white block mb-1 font-semibold">Таймаут команды SSH (сек)</label>
              <input
                type="number"
                min={10}
                max={180}
                value={sshCommandTimeout}
                onChange={(e) => setSshCommandTimeout(Number(e.target.value))}
                className="glass-input w-full font-mono"
              />
            </div>

            <div>
              <label className="text-white block mb-1 font-semibold">Таймаут SFTP передачи (сек)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={sftpTimeout}
                onChange={(e) => setSftpTimeout(Number(e.target.value))}
                className="glass-input w-full font-mono"
              />
            </div>
          </div>
        </div>

        {/* Storage Retention & Backup */}
        <div className="bg-[#111928] border border-[#1e293b] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2.5 text-white font-bold text-sm border-b border-[#1e293b] pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <RiHardDrive2Line className="w-5 h-5" />
            </div>
            <span>Хранилище MinIO и политики резервного копирования</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white block mb-1 font-semibold">Срок хранения медиа (дней)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={minioRetention}
                onChange={(e) => setMinioRetention(Number(e.target.value))}
                className="glass-input w-full font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Автоматический Garbage Collector удаляет неиспользуемые объекты</span>
            </div>

            <div>
              <label className="text-white block mb-1 font-semibold">Срок хранения бэкапов касс (дней)</label>
              <input
                type="number"
                min={7}
                max={90}
                value={backupRetention}
                onChange={(e) => setBackupRetention(Number(e.target.value))}
                className="glass-input w-full font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Ротация контрольных снимков gs.db</span>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center space-x-2 disabled:opacity-50 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            <RiSave3Line className="w-4 h-4 text-white" />
            <span>{updateMutation.isPending ? 'Сохранение...' : 'Сохранить настройки'}</span>
          </motion.button>
        </div>

      </form>
    </div>
  );
};
