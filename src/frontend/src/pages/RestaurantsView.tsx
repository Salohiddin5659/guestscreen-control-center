import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Store, 
  MapPin, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Monitor, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Wifi, 
  WifiOff,
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { topologyApi, Branch, Region, Cashier, getCurrentUserFromStorage } from '../api/client';
import { getBrand } from '../utils/brand';

export const RestaurantsView: React.FC = () => {
  const brand = getBrand();
  const queryClient = useQueryClient();

  const currentUser = getCurrentUserFromStorage();
  const canManageBranches = Boolean(
    currentUser?.role && ['ADMINISTRATOR', 'ADMIN', 'SUPERVISOR'].includes(currentUser.role.toUpperCase())
  );

  const [selectedRegionId, setSelectedRegionId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [addRestaurantOpen, setAddRestaurantOpen] = useState(false);
  const [editRestaurant, setEditRestaurant] = useState<Branch | null>(null);
  const [addRegionOpen, setAddRegionOpen] = useState(false);
  const [editRegion, setEditRegion] = useState<Region | null>(null);

  // Restaurant Form State
  const [restName, setRestName] = useState('');
  const [restRegionId, setRestRegionId] = useState('');
  const [restCode, setRestCode] = useState('');
  const [restAddress, setRestAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Region Form State
  const [regName, setRegName] = useState('');
  const [regCode, setRegCode] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Queries
  const { data: regions = [], isLoading: loadingRegions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => topologyApi.listRegions(),
  });

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => topologyApi.listBranches(),
  });

  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => topologyApi.listCashiers(),
  });

  // Maps
  const regionMap = useMemo(() => {
    const map = new Map<string, Region>();
    regions.forEach(r => map.set(r.id, r));
    return map;
  }, [regions]);

  const cashiersByBranch = useMemo(() => {
    const map = new Map<string, Cashier[]>();
    cashiers.forEach(c => {
      const list = map.get(c.branch_id) || [];
      list.push(c);
      map.set(c.branch_id, list);
    });
    return map;
  }, [cashiers]);

  // Mutations
  const createBranchMutation = useMutation({
    mutationFn: (data: { region_id: string; name: string; code: string; address?: string }) =>
      topologyApi.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setAddRestaurantOpen(false);
      resetRestForm();
    },
    onError: (err: any) => setFormError(err.message || 'Ошибка создания ресторана'),
  });

  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { region_id?: string; name?: string; code?: string; address?: string } }) =>
      topologyApi.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setEditRestaurant(null);
      resetRestForm();
    },
    onError: (err: any) => setFormError(err.message || 'Ошибка обновления ресторана'),
  });

  const deleteBranchMutation = useMutation({
    mutationFn: (id: string) => topologyApi.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (err: any) => alert(`Ошибка удаления ресторана: ${err.message}`),
  });

  const createRegionMutation = useMutation({
    mutationFn: (data: { name: string; code: string }) => topologyApi.createRegion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      setAddRegionOpen(false);
      setRegName('');
      setRegCode('');
      setRegError(null);
    },
    onError: (err: any) => setRegError(err.message || 'Ошибка создания региона'),
  });

  const updateRegionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; code?: string } }) =>
      topologyApi.updateRegion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      setEditRegion(null);
      setRegName('');
      setRegCode('');
      setRegError(null);
    },
    onError: (err: any) => setRegError(err.message || 'Ошибка обновления региона'),
  });

  const deleteRegionMutation = useMutation({
    mutationFn: (id: string) => topologyApi.deleteRegion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      if (selectedRegionId === editRegion?.id) setSelectedRegionId('ALL');
    },
    onError: (err: any) => alert(`Ошибка удаления региона: ${err.message}`),
  });

  const resetRestForm = () => {
    setRestName('');
    setRestRegionId(regions[0]?.id || '');
    setRestCode('');
    setRestAddress('');
    setFormError(null);
  };

  const openAddRestaurant = (preselectedRegionId?: string) => {
    if (!canManageBranches) return;
    resetRestForm();
    if (preselectedRegionId && preselectedRegionId !== 'ALL') {
      setRestRegionId(preselectedRegionId);
    } else if (regions.length > 0) {
      setRestRegionId(regions[0].id);
    }
    setAddRestaurantOpen(true);
  };

  const openEditRestaurant = (b: Branch) => {
    if (!canManageBranches) return;
    setRestName(b.name);
    setRestRegionId(b.region_id);
    setRestCode(b.code);
    setRestAddress(b.address || '');
    setFormError(null);
    setEditRestaurant(b);
  };

  const openEditRegion = (r: Region) => {
    if (!canManageBranches) return;
    setRegName(r.name);
    setRegCode(r.code);
    setRegError(null);
    setEditRegion(r);
  };

  // Auto-code suggestion from name
  const handleNameChange = (val: string) => {
    setRestName(val);
    if (!editRestaurant && (!restCode || restCode === restName.toUpperCase().replace(/[^A-Z0-9]/g, ''))) {
      const translit = val
        .toUpperCase()
        .replace(/РЕСТОРАН|ФИЛИАЛ/gi, '')
        .trim()
        .replace(/[^A-ZА-Я0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      setRestCode(translit || 'REST');
    }
  };

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches
      .filter(b => {
        if (selectedRegionId !== 'ALL' && b.region_id !== selectedRegionId) return false;
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const region = regionMap.get(b.region_id);
        return (
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          (b.address && b.address.toLowerCase().includes(q)) ||
          (region && region.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [branches, selectedRegionId, searchQuery, regionMap]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
              <Building2 className="w-7 h-7 text-[#A9DFD8]" />
              <span>Рестораны и регионы</span>
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold glass-surface-l1 glass-specular-edge text-[#A9DFD8] border border-white/10 flex items-center gap-1.5 shadow-sm">
              <img src={brand.emblem} className="w-3.5 h-3.5 rounded object-contain" alt="" />
              {brand.name} • {branches.length} ресторанов
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Группировка ресторанов по регионам (Ташкент, Ташкентская область и другие), управление точками и кассами
          </p>
        </div>

        {canManageBranches && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                setRegName('');
                setRegCode('');
                setRegError(null);
                setAddRegionOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold glass-btn-secondary flex items-center space-x-2 shadow-md liquid-interactive relative overflow-hidden transition-all duration-200 hover:border-[#A9DFD8]/40"
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              <MapPin className="w-3.5 h-3.5 text-[#A9DFD8]" />
              <span>Добавить регион</span>
            </button>

            <button
              onClick={() => openAddRestaurant(selectedRegionId)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold glass-btn-primary flex items-center space-x-2 shadow-lg shadow-[#A9DFD8]/20 liquid-interactive relative overflow-hidden transition-all duration-200"
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
              <Plus className="w-4 h-4" />
              <span>Добавить ресторан</span>
            </button>
          </div>
        )}
      </div>

      {/* Region Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-white/10">
        <button
          onClick={() => setSelectedRegionId('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 shadow-sm ${
            selectedRegionId === 'ALL'
              ? 'glass-active-capsule font-bold shadow-md'
              : 'glass-surface-l1 text-slate-400 hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Все регионы</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold">
            {branches.length}
          </span>
        </button>

        {regions.map((reg) => {
          const count = branches.filter(b => b.region_id === reg.id).length;
          const isSelected = selectedRegionId === reg.id;
          return (
            <div key={reg.id} className="flex items-center group">
              <button
                onClick={() => setSelectedRegionId(reg.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 shadow-sm ${
                  isSelected
                    ? 'glass-active-capsule font-bold shadow-md'
                    : 'glass-surface-l1 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 opacity-70" />
                <span>{reg.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono font-bold">
                  {count}
                </span>
              </button>

              {/* Region quick edit icon */}
              {canManageBranches && (
                <button
                  onClick={(e) => { e.stopPropagation(); openEditRegion(reg); }}
                  className="ml-1 p-1 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded"
                  title={`Редактировать регион "${reg.name}"`}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-surface-l2 glass-specular-edge p-3.5 rounded-2xl shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по ресторану, коду или адресу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 pr-3.5 py-2 text-xs"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono self-end sm:self-auto">
          <span>Найдено: <strong className="text-white">{filteredBranches.length}</strong></span>
          <span>•</span>
          <span>Касс: <strong className="text-[#A9DFD8]">{filteredBranches.reduce((acc, b) => acc + (cashiersByBranch.get(b.id)?.length || 0), 0)}</strong></span>
        </div>
      </div>

      {/* Restaurants Grid */}
      {filteredBranches.length === 0 ? (
        <div className="glass-surface-l2 glass-specular-edge rounded-2xl p-12 text-center shadow-xl">
          <Store className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-white">Рестораны не найдены</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery 
              ? 'Ни один ресторан не совпадает с поисковым запросом'
              : 'В выбранном регионе пока нет добавленных ресторанов'}
          </p>
          {canManageBranches && (
            <button
              onClick={() => openAddRestaurant(selectedRegionId)}
              className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold glass-btn-primary inline-flex items-center space-x-2 shadow-lg shadow-[#A9DFD8]/20 liquid-interactive relative overflow-hidden"
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
              <Plus className="w-3.5 h-3.5" />
              <span>Добавить ресторан</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => {
            const region = regionMap.get(branch.region_id);
            const branchCashiers = cashiersByBranch.get(branch.id) || [];
            const onlineCashiers = branchCashiers.filter(c => c.last_sync_status === 'SUCCESS' || c.last_sync_status === 'ONLINE').length;

            return (
              <div
                key={branch.id}
                className="glass-surface-l2 glass-specular-edge hover:border-[#A9DFD8]/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all duration-300 group"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <img src={brand.emblem} className="w-4 h-4 rounded object-contain shadow-sm" alt={brand.name} />
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-white/5 text-[#A9DFD8] border border-white/10">
                        {branch.code}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-slate-400 flex items-center space-x-1 border border-white/10">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{region?.name || 'Регион не указан'}</span>
                      </span>
                    </div>

                    {canManageBranches && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditRestaurant(branch)}
                          className="p-1.5 text-slate-400 hover:text-[#A9DFD8] rounded-lg hover:bg-white/10 transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (branchCashiers.length > 0) {
                              alert(`Невозможно удалить: к ресторану "${branch.name}" привязано ${branchCashiers.length} касс. Сначала удалите или переместите кассы.`);
                              return;
                            }
                            if (window.confirm(`Удалить ресторан "${branch.name}" (${branch.code})?`)) {
                              deleteBranchMutation.mutate(branch.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/15 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-[#A9DFD8] transition-colors">
                    {branch.name}
                  </h3>

                  {/* Address */}
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px] line-clamp-2">
                    {branch.address || 'Адрес не указан'}
                  </p>
                </div>

                {/* Cashiers Fleet Footer */}
                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Monitor className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-200">
                      {branchCashiers.length} касс
                    </span>
                    {branchCashiers.length > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                        {onlineCashiers} онлайн
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {branchCashiers.slice(0, 3).map((c) => (
                      <span
                        key={c.id}
                        className={`w-2 h-2 rounded-full ${
                          (c.last_sync_status === 'SUCCESS' || c.last_sync_status === 'ONLINE') ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]' : 'bg-slate-600'
                        }`}
                        title={`${c.name} (${c.ip_address}): ${c.last_sync_status}`}
                      />
                    ))}
                    {branchCashiers.length > 3 && (
                      <span className="text-[9px] text-slate-400 font-mono">+{branchCashiers.length - 3}</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Добавить / Изменить ресторан (Liquid Glass Level 4) */}
      {(addRestaurantOpen || editRestaurant) && (
        <div className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Store className="w-4 h-4 text-[#A9DFD8]" />
                <span>{editRestaurant ? 'Редактировать ресторан' : 'Новый ресторан'}</span>
              </h3>
              <button 
                onClick={() => { setAddRestaurantOpen(false); setEditRestaurant(null); }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!restName.trim() || !restCode.trim() || !restRegionId) {
                  setFormError('Заполните обязательные поля');
                  return;
                }
                if (editRestaurant) {
                  updateBranchMutation.mutate({
                    id: editRestaurant.id,
                    data: {
                      name: restName.trim(),
                      code: restCode.trim().toUpperCase(),
                      region_id: restRegionId,
                      address: restAddress.trim(),
                    }
                  });
                } else {
                  createBranchMutation.mutate({
                    name: restName.trim(),
                    code: restCode.trim().toUpperCase(),
                    region_id: restRegionId,
                    address: restAddress.trim(),
                  });
                }
              }}
              className="p-5 space-y-4 text-xs"
            >
              {formError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Название ресторана / филиала *</label>
                <input
                  type="text"
                  placeholder="Например: Ресторан Юнусабад"
                  value={restName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="glass-input text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Регион (Область) *</label>
                <select
                  value={restRegionId}
                  onChange={(e) => setRestRegionId(e.target.value)}
                  className="glass-input text-xs font-medium"
                  required
                >
                  {regions.map(r => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">{r.name} ({r.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Код ресторана (для интеграций) *</label>
                <input
                  type="text"
                  placeholder="YUNUSABAD"
                  value={restCode}
                  onChange={(e) => setRestCode(e.target.value.toUpperCase())}
                  className="glass-input font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Адрес ресторана</label>
                <input
                  type="text"
                  placeholder="г. Ташкент, Юнусабадский район, кв-л 14"
                  value={restAddress}
                  onChange={(e) => setRestAddress(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setAddRestaurantOpen(false); setEditRestaurant(null); }}
                  className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
                  className="px-5 py-2 rounded-xl glass-btn-primary text-xs font-bold shadow-md shadow-[#A9DFD8]/20"
                >
                  {createBranchMutation.isPending || updateBranchMutation.isPending ? 'Сохранение...' : (editRestaurant ? 'Сохранить изменения' : 'Создать ресторан')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Добавить / Изменить регион (Liquid Glass Level 4) */}
      {(addRegionOpen || editRegion) && (
        <div className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#A9DFD8]" />
                <span>{editRegion ? 'Редактировать регион' : 'Новый регион'}</span>
              </h3>
              <button 
                onClick={() => { setAddRegionOpen(false); setEditRegion(null); }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!regName.trim() || !regCode.trim()) {
                  setRegError('Заполните обязательные поля');
                  return;
                }
                if (editRegion) {
                  updateRegionMutation.mutate({
                    id: editRegion.id,
                    data: {
                      name: regName.trim(),
                      code: regCode.trim().toUpperCase(),
                    }
                  });
                } else {
                  createRegionMutation.mutate({
                    name: regName.trim(),
                    code: regCode.trim().toUpperCase(),
                  });
                }
              }}
              className="p-5 space-y-4 text-xs"
            >
              {regError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Название региона (Области) *</label>
                <input
                  type="text"
                  placeholder="Например: Бухарская область"
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    if (!editRegion && !regCode) {
                      const code = e.target.value.toUpperCase().replace(/[^A-ZА-Я0-9]/g, '').slice(0, 5);
                      setRegCode(code);
                    }
                  }}
                  className="glass-input text-xs font-medium"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Код региона *</label>
                <input
                  type="text"
                  placeholder="BUK"
                  value={regCode}
                  onChange={(e) => setRegCode(e.target.value.toUpperCase())}
                  className="glass-input font-mono text-xs"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/10">
                {editRegion ? (
                  <button
                    type="button"
                    onClick={() => {
                      const count = branches.filter(b => b.region_id === editRegion.id).length;
                      if (count > 0) {
                        alert(`Невозможно удалить регион: к нему привязано ${count} ресторанов. Сначала удалите или переместите рестораны.`);
                        return;
                      }
                      if (window.confirm(`Удалить регион "${editRegion.name}"?`)) {
                        deleteRegionMutation.mutate(editRegion.id);
                        setEditRegion(null);
                      }
                    }}
                    className="px-3 py-2 text-rose-400 hover:bg-rose-500/15 rounded-xl font-semibold transition-colors"
                  >
                    Удалить регион
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => { setAddRegionOpen(false); setEditRegion(null); }}
                    className="px-4 py-2 rounded-xl glass-btn-secondary text-xs font-semibold"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={createRegionMutation.isPending || updateRegionMutation.isPending}
                    className="px-5 py-2 rounded-xl glass-btn-primary text-xs font-bold shadow-md shadow-[#A9DFD8]/20"
                  >
                    {createRegionMutation.isPending || updateRegionMutation.isPending ? 'Сохранение...' : (editRegion ? 'Сохранить' : 'Создать регион')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
