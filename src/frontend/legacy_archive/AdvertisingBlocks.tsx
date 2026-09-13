import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Send, 
  Eye, 
  Copy, 
  Trash2, 
  Edit, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  Sparkles,
  Monitor
} from 'lucide-react';
import { templateApi } from '../api/client';
import { TemplatePreviewModal } from '../components/TemplatePreviewModal';

export const AdvertisingBlocks: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [areaFilter, setAreaFilter] = useState<'ALL' | 'FULL_SCREEN' | 'MODE32_PROMO'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'STATIC' | 'SLIDESHOW' | 'VIDEO'>('ALL');
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: blocks, isLoading, error } = useQuery({
    queryKey: ['advertising-blocks'],
    queryFn: () => templateApi.list(),
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => templateApi.duplicate(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      setFeedbackMsg({ type: 'success', text: `Шаблон успешно скопирован: «${data.name}»` });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: any) => {
      setFeedbackMsg({ type: 'error', text: err.message || 'Ошибка копирования шаблона' });
      setTimeout(() => setFeedbackMsg(null), 5000);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
      setDeletingId(null);
      setFeedbackMsg({ type: 'success', text: 'Рекламный блок успешно удален' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    },
    onError: (err: any) => {
      setDeletingId(null);
      setFeedbackMsg({ type: 'error', text: err.message || 'Ошибка удаления шаблона' });
      setTimeout(() => setFeedbackMsg(null), 5000);
    },
  });

  const filteredBlocks = useMemo(() => {
    if (!blocks) return [];
    return blocks.filter((b: any) => {
      const matchesSearch = 
        !search || 
        b.name.toLowerCase().includes(search.toLowerCase()) || 
        (b.description && b.description.toLowerCase().includes(search.toLowerCase()));
      
      const matchesArea = areaFilter === 'ALL' || b.area === areaFilter;
      const matchesMode = modeFilter === 'ALL' || b.display_mode === modeFilter;

      return matchesSearch && matchesArea && matchesMode;
    });
  }, [blocks, search, areaFilter, modeFilter]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Рекламные шаблоны</h2>
          <p className="text-sm text-slate-500 mt-1">
            Управление шаблонами рекламы для зон кассового экрана (1024×768 и 512×768)
          </p>
        </div>
        <Link
          to="/blocks/new"
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition shadow-sm space-x-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Создать шаблон</span>
        </Link>
      </div>

      {/* Feedback alerts */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-70 hover:opacity-100">
            Закрыть
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск шаблонов по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Area filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setAreaFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                areaFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все зоны
            </button>
            <button
              onClick={() => setAreaFilter('FULL_SCREEN')}
              className={`px-3 py-1.5 rounded-lg transition ${
                areaFilter === 'FULL_SCREEN' ? 'bg-white text-indigo-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Screen
            </button>
            <button
              onClick={() => setAreaFilter('MODE32_PROMO')}
              className={`px-3 py-1.5 rounded-lg transition ${
                areaFilter === 'MODE32_PROMO' ? 'bg-white text-purple-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mode 32 Promo
            </button>
          </div>

          {/* Mode filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setModeFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                modeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setModeFilter('STATIC')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                modeFilter === 'STATIC' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Static
            </button>
            <button
              onClick={() => setModeFilter('SLIDESHOW')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                modeFilter === 'SLIDESHOW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Slideshow
            </button>
            <button
              onClick={() => setModeFilter('VIDEO')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                modeFilter === 'VIDEO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Video
            </button>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Загрузка каталога шаблонов...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
          Ошибка при загрузке шаблонов
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 text-base">Шаблоны не найдены</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || areaFilter !== 'ALL' || modeFilter !== 'ALL'
              ? 'Попробуйте изменить параметры фильтрации или поисковый запрос.'
              : 'Создайте свой первый рекламный блок для трансляции на экраны покупателей.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlocks.map((block: any) => (
            <div 
              key={block.id} 
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition group"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    block.area === 'FULL_SCREEN' 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'bg-purple-50 text-purple-700'
                  }`}>
                    {block.area === 'FULL_SCREEN' ? 'Full Screen (1024×768)' : 'Mode 32 Promo (512×768)'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                      v{block.version || 1}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {block.display_mode}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition">
                  {block.name}
                </h3>
                
                {block.description ? (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{block.description}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5 italic">Без описания</p>
                )}

                <div className="mt-4 flex items-center space-x-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>{block.display_mode === 'STATIC' ? '1 баннер' : `${block.items?.length || 'Слайдшоу'}`}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span>{new Date(block.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPreviewTemplateId(block.id)}
                    title="Интерактивный предпросмотр"
                    className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Превью</span>
                  </button>

                  <button
                    onClick={() => duplicateMutation.mutate(block.id)}
                    disabled={duplicateMutation.isPending}
                    title="Дублировать шаблон в 1 клик"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <Link
                    to={`/blocks/${block.id}/edit`}
                    title="Редактировать шаблон"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setDeletingId(block.id)}
                    title="Удалить шаблон"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  to={`/publications?block=${block.id}`}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition space-x-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Публикация</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">Удаление шаблона</h3>
            </div>
            <p className="text-sm text-slate-600">
              Вы действительно хотите удалить этот рекламный шаблон? 
              <br />
              <span className="text-xs text-slate-500 mt-2 block">
                Обратите внимание: контент на уже обновлённых кассах затронут не будет. Кассы продолжат показ из локальной базы gs.db до следующей публикации.
              </span>
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm font-medium text-slate-700 transition"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingId)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Удаление...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High-fidelity Preview Modal */}
      <TemplatePreviewModal
        templateId={previewTemplateId}
        onClose={() => setPreviewTemplateId(null)}
      />
    </div>
  );
};
