import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Radio, 
  Key, 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  X,
  Server,
  ShieldCheck
} from 'lucide-react';
import { apiRequest, topologyApi } from '../api/client';

export const Topology: React.FC = () => {
  const queryClient = useQueryClient();
  const [testingCashierId, setTestingCashierId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Edit / Create Cashier Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCashier, setEditingCashier] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formPort, setFormPort] = useState(22);
  const [formBranchId, setFormBranchId] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Branches, Cashiers
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => topologyApi.listBranches(),
  });

  const { data: cashiers, isLoading } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => topologyApi.listCashiers(),
    refetchInterval: 15000,
  });

  // Test Connection Mutation
  const testMutation = useMutation({
    mutationFn: (cashierId: string) => topologyApi.testConnection(cashierId),
    onMutate: (id) => {
      setTestingCashierId(id);
      setTestResult(null);
    },
    onSuccess: (data) => {
      setTestResult(data);
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
    },
    onSettled: () => {
      setTestingCashierId(null);
    },
  });

  // Save Cashier Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: formName,
        ip_address: formIp,
        ssh_port: formPort,
        branch_id: formBranchId,
      };
      if (formPassword.trim()) {
        payload.ssh_password = formPassword.trim();
      }

      if (editingCashier) {
        return topologyApi.updateCashier(editingCashier.id, payload);
      } else {
        return topologyApi.createCashier(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.message || 'Ошибка сохранения кассы');
    },
  });

  const openCreateModal = () => {
    resetForm();
    setEditingCashier(null);
    if (branches && branches.length > 0) {
      setFormBranchId(branches[0].id);
    }
    setModalOpen(true);
  };

  const openEditModal = (cashier: any) => {
    resetForm();
    setEditingCashier(cashier);
    setFormName(cashier.name);
    setFormIp(cashier.ip_address);
    setFormPort(cashier.ssh_port || 22);
    setFormBranchId(cashier.branch_id);
    setModalOpen(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormIp('');
    setFormPort(22);
    setFormBranchId('');
    setFormPassword('');
    setShowPassword(false);
    setFormError(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Синхронизировано</span>;
      case 'PUBLISHED_AWAITING_RESTART':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" /> Ожидает перезапуска</span>;
      case 'OFFLINE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"><Radio className="w-3 h-3 mr-1" /> Недоступна</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><AlertTriangle className="w-3 h-3 mr-1" /> Ошибка</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Неизвестно</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Топология сети касс</h2>
          <p className="text-sm text-slate-500 mt-1">Иерархия Регионы → Филиалы → Кассовые моноблоки POS</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm space-x-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить кассу</span>
        </button>
      </div>

      {/* Test Connection Result Banner */}
      {testResult && (
        <div className={`p-4 rounded-2xl border ${testResult.online ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {testResult.online ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
              <div>
                <p className="font-semibold text-sm">
                  {testResult.online ? 'Связь с кассой установлена успешно' : 'Ошибка соединения с кассой'}
                </p>
                {testResult.response_time_ms && (
                  <p className="text-xs text-slate-600">Время отклика: {testResult.response_time_ms} мс</p>
                )}
                {testResult.inspection && (
                  <p className="text-xs text-slate-600">
                    GuestScreen: {testResult.inspection.guest_screen_version || 'N/A'} • Свободно: {testResult.inspection.free_space_mb} МБ
                  </p>
                )}
                {testResult.error_message && (
                  <p className="text-xs text-rose-600 font-mono mt-0.5">{testResult.error_message}</p>
                )}
              </div>
            </div>
            <button onClick={() => setTestResult(null)} className="text-xs text-slate-400 hover:text-slate-600">
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Cashier Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-base">Список кассовых терминалов</h3>
          <span className="text-xs text-slate-500">Всего касс: {cashiers?.length || 0}</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Загрузка данных топологии...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Имя кассы</th>
                  <th className="px-6 py-3">IP-адрес & Порт</th>
                  <th className="px-6 py-3">Филиал</th>
                  <th className="px-6 py-3">SSH Авторизация</th>
                  <th className="px-6 py-3">Статус синхронизации</th>
                  <th className="px-6 py-3">Версия GS</th>
                  <th className="px-6 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashiers?.map((c: any) => {
                  const branch = branches?.find((b: any) => b.id === c.branch_id);
                  const isTesting = testingCashierId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-600 text-xs">
                        {c.ip_address}:{c.ssh_port}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {branch?.name || '—'}
                      </td>
                      {/* SSH Credentials Indicator (Masked) */}
                      <td className="px-6 py-4">
                        {c.has_ssh_password ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Зашифрован (AES-256)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                            <span>Без пароля</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(c.last_sync_status)}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {c.guest_screen_version || '—'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition"
                          title="Редактировать кассу и SSH-пароль"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => testMutation.mutate(c.id)}
                          disabled={isTesting}
                          className="inline-flex items-center px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-700 transition disabled:opacity-50 space-x-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-600' : ''}`} />
                          <span>{isTesting ? 'Тест...' : 'Проверить SSH'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cashier Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <Server className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCashier ? 'Редактирование кассы' : 'Добавление новой кассы'}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Имя кассы *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Например: Касса 1 — Новза"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    IP-адрес *
                  </label>
                  <input
                    type="text"
                    required
                    value={formIp}
                    onChange={(e) => setFormIp(e.target.value)}
                    placeholder="10.0.0.241"
                    className="w-full font-mono border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    SSH Порт *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPort}
                    onChange={(e) => setFormPort(parseInt(e.target.value) || 22)}
                    className="w-full font-mono border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Филиал *
                </label>
                <select
                  required
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>Выберите филиал...</option>
                  {branches?.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Masked Password Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  SSH-пароль {editingCashier?.has_ssh_password && '(зашифрован)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={
                      editingCashier?.has_ssh_password
                        ? '•••••••• (оставьте пустым, чтобы не менять)'
                        : 'Введите пароль администратора SSH'
                    }
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm pr-10 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Пароль шифруется алгоритмом AES-256-GCM с мастер-ключом на сервере и никогда не возвращается в браузер.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Сохранение...' : 'Сохранить кассу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
