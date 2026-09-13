import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, Trash2, Video, AlertCircle, FileWarning, Search, Edit2, RefreshCw,
  Info, ExternalLink, CheckCircle2, X
} from 'lucide-react';
import { mediaApi, ApiError } from '../api/client';

export const MediaLibrary: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [uploading, setUploading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [renameAsset, setRenameAsset] = useState<any | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [replaceAsset, setReplaceAsset] = useState<any | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);

  const [usageModalAsset, setUsageModalAsset] = useState<any | null>(null);
  const [usageData, setUsageData] = useState<any | null>(null);

  const [deleteConflictAsset, setDeleteConflictAsset] = useState<any | null>(null);
  const [deleteConflictDetail, setDeleteConflictDetail] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch media assets
  const { data: mediaAssets, isLoading } = useQuery({
    queryKey: ['media-assets', typeFilter, search],
    queryFn: () => mediaApi.list({
      media_type: typeFilter === 'ALL' ? undefined : typeFilter,
      search: search.trim() || undefined
    }),
  });

  // Upload handler
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setWarnings([]);
    setError(null);
    setSuccessMsg(null);

    let uploadedCount = 0;
    const collectedWarnings: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await mediaApi.upload(file);
        if (res.warnings && res.warnings.length > 0) {
          collectedWarnings.push(...res.warnings);
        }
        uploadedCount++;
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки файла');
      }
    }

    if (collectedWarnings.length > 0) {
      setWarnings(collectedWarnings);
    }
    if (uploadedCount > 0) {
      setSuccessMsg(`Успешно загружено файлов: ${uploadedCount}`);
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop events
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Rename Mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, name, version }: { id: string; name: string; version: number }) =>
      mediaApi.rename(id, name, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setRenameAsset(null);
      setSuccessMsg('Название файла успешно обновлено');
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.status === 409) {
        alert(err.message);
        queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      } else {
        alert(err.message || 'Ошибка переименования');
      }
    }
  });

  // Replace Mutation
  const replaceMutation = useMutation({
    mutationFn: ({ id, file, version }: { id: string; file: File; version: number }) =>
      mediaApi.replace(id, file, version),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setReplaceAsset(null);
      setReplaceFile(null);
      setSuccessMsg('Файл успешно заменен без разрыва связей с шаблонами');
      if (res.warnings && res.warnings.length > 0) {
        setWarnings(res.warnings);
      }
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.status === 409) {
        alert(err.message);
        queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      } else {
        alert(err.message || 'Ошибка замены файла');
      }
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.delete(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] });
      setSuccessMsg(res.physical_deleted ? 'Медиа-файл и физический объект MinIO удалены' : 'Медиа-файл удален из библиотеки');
    },
    onError: (err: any, id: string) => {
      if (err instanceof ApiError && err.status === 409) {
        const asset = mediaAssets?.find((a: any) => a.id === id);
        setDeleteConflictAsset(asset);
        setDeleteConflictDetail(err.message);
      } else {
        alert(err.message || 'Ошибка удаления файла');
      }
    }
  });

  const openUsageModal = async (asset: any) => {
    setUsageModalAsset(asset);
    try {
      const data = await mediaApi.getUsage(asset.id);
      setUsageData(data);
    } catch (err: any) {
      alert('Не удалось загрузить информацию об использовании');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Медиатека</h2>
          <p className="text-sm text-slate-500 mt-1">Центральное хранилище MinIO с контролем версий и защитой зависимостей</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition cursor-pointer shadow-sm space-x-2">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Загрузка...' : 'Загрузить файл(ы)'}</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Drag and drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
        }`}
      >
        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-700 font-medium">Перетащите файлы сюда (JPG, PNG, WebP, MP4) или нажмите кнопку загрузки</p>
        <p className="text-xs text-slate-400 mt-1">Поддерживается одновременная загрузка нескольких файлов и автоматическая дедупликация SHA-256</p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-800 text-sm">
          <div className="flex items-center space-x-2 font-semibold">
            <FileWarning className="w-5 h-5 text-amber-600" />
            <span>Предупреждения валидатора:</span>
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="pl-7">{w}</p>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          {['ALL', 'IMAGE', 'VIDEO'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                typeFilter === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {type === 'ALL' ? 'Все файлы' : type === 'IMAGE' ? 'Изображения' : 'Видео'}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Загрузка медиатеки...</div>
      ) : mediaAssets?.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
          Файлы не найдены. Загрузите первые изображения или видео.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaAssets?.map((asset: any) => (
            <div key={asset.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition">
              <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                {asset.media_type === 'IMAGE' ? (
                  <img
                    src={`/media/media/${asset.s3_key}`}
                    alt={asset.original_name}
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Video className="w-12 h-12 text-slate-400" />
                )}
                <span className="absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 bg-slate-900/75 text-white rounded">
                  {asset.media_type}
                </span>
                {asset.width && asset.height && (
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 bg-slate-900/75 text-white rounded">
                    {asset.width}×{asset.height}
                  </span>
                )}
                <span className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 bg-indigo-900/75 text-white rounded">
                  v{asset.version}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm truncate" title={asset.original_name}>
                    {asset.original_name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 truncate mt-1" title={asset.sha256}>
                    SHA: {asset.sha256.slice(0, 16)}...
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(asset.file_size_bytes / 1024).toFixed(1)} КБ
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      title="Информация об использовании"
                      onClick={() => openUsageModal(asset)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      title="Переименовать"
                      onClick={() => {
                        setRenameAsset(asset);
                        setRenameValue(asset.original_name);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-50 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      title="Заменить файл без изменения ссылок"
                      onClick={() => {
                        setReplaceAsset(asset);
                        setReplaceFile(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    title="Удалить файл"
                    onClick={() => {
                      if (confirm(`Удалить медиа-файл "${asset.original_name}"?`)) {
                        deleteMutation.mutate(asset.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: In-place Rename */}
      {renameAsset && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Переименовать файл</h3>
            <div>
              <label className="text-xs font-medium text-slate-500">Оригинальное имя файла</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRenameAsset(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (renameValue.trim()) {
                    renameMutation.mutate({
                      id: renameAsset.id,
                      name: renameValue.trim(),
                      version: renameAsset.version
                    });
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: In-place Replace */}
      {replaceAsset && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Заменить файл (In-Place)</h3>
            <p className="text-xs text-slate-500">
              Новый файл заменит содержимое для всех {replaceAsset.original_name}. Все рекламные шаблоны сохранят привязку к этому элементу.
            </p>
            <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4"
                onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setReplaceAsset(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition"
              >
                Отмена
              </button>
              <button
                disabled={!replaceFile}
                onClick={() => {
                  if (replaceFile) {
                    replaceMutation.mutate({
                      id: replaceAsset.id,
                      file: replaceFile,
                      version: replaceAsset.version
                    });
                  }
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-medium transition"
              >
                Заменить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Usage Information */}
      {usageModalAsset && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Использование файла</h3>
              <button onClick={() => setUsageModalAsset(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 truncate">
              Файл: <span className="font-semibold text-slate-700">{usageModalAsset.original_name}</span>
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {usageData?.templates.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Файл пока не используется ни в одном рекламном шаблоне.</p>
              ) : (
                usageData?.templates.map((tpl: any) => (
                  <div key={tpl.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{tpl.name}</p>
                      <p className="text-xs text-slate-500">{tpl.area} • {tpl.display_mode}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${tpl.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                      {tpl.is_active ? 'Активен' : 'Отключен'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setUsageModalAsset(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Conflict (HTTP 409) */}
      {deleteConflictAsset && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Удаление заблокировано</h3>
            </div>
            <p className="text-sm text-slate-600">
              {deleteConflictDetail || 'Медиа-файл используется в активных рекламных шаблонах. Для безопасного удаления сначала исключите его из плейлистов.'}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  const a = deleteConflictAsset;
                  setDeleteConflictAsset(null);
                  openUsageModal(a);
                }}
                className="px-4 py-2 border border-slate-200 text-indigo-600 hover:bg-indigo-50 rounded-xl text-sm font-medium transition"
              >
                Посмотреть шаблоны
              </button>
              <button
                onClick={() => setDeleteConflictAsset(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
