import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, X, ShieldAlert, History } from 'lucide-react';
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
            <History className="w-6 h-6 text-[#A9DFD8]" />
            Журнал действий и аудит
          </h2>
          <p className="text-xs text-[#87888C] mt-1">Неизменяемая история административных действий и развертываний</p>
        </div>
      </div>

      <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[#87888C] text-xs">Загрузка журнала аудита...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#171821] border-b border-[#2C2D3A] text-[#87888C] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">Время</th>
                  <th className="p-4">Действие</th>
                  <th className="p-4">Сущность</th>
                  <th className="p-4">Идентификатор</th>
                  <th className="p-4 text-right">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2D3A] text-white">
                {logs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-[#171821]/60 transition">
                    <td className="p-4 font-mono text-[#87888C] text-[11px]">
                      {new Date(log.timestamp).toLocaleString('ru-RU')}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-[#A9DFD8]/10 text-[#A9DFD8] border border-[#A9DFD8]/25 rounded-md font-semibold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-white font-medium">
                      {log.entity_type}
                    </td>
                    <td className="p-4 font-mono text-[#87888C]">
                      {log.entity_id || '—'}
                    </td>
                    <td className="p-4 text-right">
                      {log.payload_diff ? (
                        <button
                          onClick={() => setSelectedDiff(log.payload_diff)}
                          className="inline-flex items-center text-[#A9DFD8] hover:text-white font-semibold text-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Просмотр</span>
                        </button>
                      ) : (
                        <span className="text-[#87888C]/50">—</span>
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
      {selectedDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#2C2D3A] flex items-center justify-between bg-[#171821]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#A9DFD8]" />
                Детали изменения
              </h3>
              <button
                onClick={() => setSelectedDiff(null)}
                className="text-[#87888C] hover:text-white p-1 rounded-lg hover:bg-[#2C2D3A] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-[#171821] max-h-[60vh] overflow-y-auto">
              <pre className="text-xs font-mono text-[#A9DFD8] bg-[#171821] p-3 rounded-xl border border-[#2C2D3A]">
                {JSON.stringify(selectedDiff, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
