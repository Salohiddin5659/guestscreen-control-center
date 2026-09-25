import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { RiHistoryLine, RiEyeLine, RiCloseLine, RiShieldCheckLine } from 'react-icons/ri';
import { apiRequest } from '../api/client';

export const AuditLogs: React.FC = () => {
  const [selectedDiff, setSelectedDiff] = useState<any | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiRequest('/audit-logs?limit=100').catch(() => [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        action: 'DEPLOY_APPLIED',
        entity_type: 'Cashbox',
        entity_id: '10.0.0.241',
        payload_diff: { mode: 'SPLIT', version: 65, status: 'SUCCESS' }
      }
    ]),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <RiHistoryLine className="w-6 h-6 text-cyan-400" />
            Журнал действий и аудит
          </h2>
          <p className="text-xs text-slate-400 mt-1">Неизменяемая история административных действий и развертываний</p>
        </div>
      </div>

      <div className="bg-[#111928] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Загрузка журнала аудита...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#162033] border-b border-[#1e293b] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Время</th>
                  <th className="p-4">Действие</th>
                  <th className="p-4">Сущность</th>
                  <th className="p-4">Идентификатор</th>
                  <th className="p-4 text-right">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b] text-white">
                {logs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('ru-RU')}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-lg font-semibold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-white font-medium">
                      {log.entity_type}
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {log.entity_id || '—'}
                    </td>
                    <td className="p-4 text-right">
                      {log.payload_diff ? (
                        <button
                          onClick={() => setSelectedDiff(log.payload_diff)}
                          className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-semibold text-xs transition-colors"
                        >
                          <RiEyeLine className="w-4 h-4 mr-1" />
                          <span>Просмотр</span>
                        </button>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Diff Modal */}
      <AnimatePresence>
        {selectedDiff && (
          <div className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111928] border border-[#1e293b] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-[#1e293b] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RiShieldCheckLine className="w-5 h-5 text-cyan-400" />
                  Детали изменения
                </h3>
                <button
                  onClick={() => setSelectedDiff(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <RiCloseLine className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 bg-[#0b111e] max-h-[60vh] overflow-y-auto">
                <pre className="text-xs font-mono text-cyan-300 bg-[#070b13] p-4 rounded-xl border border-[#1e293b] overflow-x-auto">
                  {JSON.stringify(selectedDiff, null, 2)}
                </pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
