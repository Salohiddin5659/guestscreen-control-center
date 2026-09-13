import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Monitor, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Plus, 
  Send,
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../api/client';

export const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiRequest('/dashboard/overview'),
    refetchInterval: 10000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const metrics = [
    { label: 'Всего касс', value: data.total_cashiers, icon: Monitor, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Синхронизировано', value: data.online_cashiers, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ожидают перезапуска', value: data.awaiting_restart, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Недоступны / Ошибки', value: data.offline_cashiers, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Активных баннеров', value: data.active_advertising_blocks, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Обзор системы</h2>
          <p className="text-sm text-slate-500 mt-1">Централизованный мониторинг касс UCS Guest Screen</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/blocks/new"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Новый блок</span>
          </Link>
          <Link
            to="/publications"
            className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition shadow-sm space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Публикации</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${m.bg} ${m.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">{m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Publications Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-base">Последние пакеты публикаций</h3>
          <Link to="/publications" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1">
            <span>Все публикации</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recent_batches.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Публикаций пока не производилось. Создайте рекламный блок и запустите публикацию.
            </div>
          ) : (
            data.recent_batches.map((b: any) => (
              <div key={b.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-slate-900">Пакет #{b.id.slice(0, 8)}</span>
                    <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-mono">
                      {b.scope_type}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      b.status === 'RUNNING' ? 'bg-indigo-50 text-indigo-700 animate-pulse' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Касс: {b.total_cashiers} • Успешно: {b.success_count} • Ожидают перезапуска: {b.awaiting_restart_count} • Ошибок: {b.failed_count}
                  </p>
                </div>
                <Link
                  to={`/publications?batch=${b.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Мониторинг →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
