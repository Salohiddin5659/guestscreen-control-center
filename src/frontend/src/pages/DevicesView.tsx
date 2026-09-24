import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Monitor, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  Plus, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  Activity, 
  Wifi, 
  WifiOff, 
  Radio, 
  Pencil, 
  X,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2
} from 'lucide-react';
import { 
  topologyApi, 
  advertisingApi, 
  Cashier, 
  Branch, 
  Region, 
  AdvertisingBlockListItem,
  ConnectionTestResult,
  getCurrentUserFromStorage
} from '../api/client';
import { useLiveFleet } from '../api/useLiveFleet';
import { DeviceDetailModal } from '../components/devices/DeviceDetailModal';
import { AdConfigModal } from '../components/config/AdConfigModal';
import { DeploymentProgressModal } from '../components/deployment/DeploymentProgressModal';
import { getBrand } from '../utils/brand';

export const DevicesView: React.FC = () => {
  const brand = getBrand();
  const queryClient = useQueryClient();
  const { isConnected } = useLiveFleet();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUser = getCurrentUserFromStorage();
  const canManageDevices = Boolean(
    currentUser?.role && ['ADMINISTRATOR', 'ADMIN', 'SUPERVISOR'].includes(currentUser.role.toUpperCase())
  );
  // Alias for readability: only admins/supervisors see technical details (hashes, block IDs, etc.)
  const isAdminOrSupervisor = canManageDevices;

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Multi-criteria filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'FAILED' | 'PENDING'>('ALL');
  const [versionFilter, setVersionFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Sync state with URL search params (e.g. from notification clicks ?search=192.168.106.101 or ?status=OFFLINE)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam !== null) {
      setSearchQuery(searchParam);
    }
    const statusParam = searchParams.get('status');
    if (statusParam && ['ALL', 'ONLINE', 'OFFLINE', 'FAILED', 'PENDING'].includes(statusParam.toUpperCase())) {
      setStatusFilter(statusParam.toUpperCase() as any);
    }
    const branchParam = searchParams.get('branch');
    if (branchParam !== null) {
      setBranchFilter(branchParam);
    }
  }, [searchParams]);

  // Sorting state
  type SortField = 'status' | 'name' | 'ip' | 'branch' | 'version' | 'last_seen';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>('branch');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [detailCashier, setDetailCashier] = useState<Cashier | null>(null);
  const [adConfigOpen, setAdConfigOpen] = useState(false);
  const [adConfigInitialCashierIds, setAdConfigInitialCashierIds] = useState<string[]>([]);
  const [addCashierModalOpen, setAddCashierModalOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Connection test inline states: cashierId -> { loading, result }
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; res: ConnectionTestResult } | null>(null);

  // Add Cashier Form state
  const [newName, setNewName] = useState('');
  const [newIp, setNewIp] = useState('');
  const [newPort, setNewPort] = useState(22);
  const [newBranchId, setNewBranchId] = useState('');
  const [newSshUsername, setNewSshUsername] = useState('');
  const [newSshPassword, setNewSshPassword] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  // Edit Cashier Form state
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);
  const [editName, setEditName] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editPort, setEditPort] = useState(22);
  const [editBranchId, setEditBranchId] = useState('');
  const [editSshUsername, setEditSshUsername] = useState('');
  const [editSshPassword, setEditSshPassword] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Queries
  const { data: cashiers = [], isLoading: loadingCashiers, refetch: refetchCashiers } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => topologyApi.listCashiers(),
    refetchInterval: 10000,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => topologyApi.listBranches(),
  });

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => topologyApi.listRegions(),
  });

  const { data: adBlocks = [] } = useQuery({
    queryKey: ['advertising-blocks'],
    queryFn: () => advertisingApi.list(),
  });

  // Maps for quick lookup
  const branchMap = useMemo(() => {
    const map = new Map<string, Branch>();
    branches.forEach(b => map.set(b.id, b));
    return map;
  }, [branches]);

  const regionMap = useMemo(() => {
    const map = new Map<string, Region>();
    regions.forEach(r => map.set(r.id, r));
    return map;
  }, [regions]);

  const adBlockMap = useMemo(() => {
    const map = new Map<string, AdvertisingBlockListItem>();
    adBlocks.forEach(b => map.set(b.id, b));
    return map;
  }, [adBlocks]);

  // Unique versions list
  const availableVersions = useMemo(() => {
    const set = new Set<string>();
    cashiers.forEach(c => {
      const v = c.guest_screen_version || '3.1.1.0';
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [cashiers]);

  // Set default branch in add modal
  React.useEffect(() => {
    if (branches.length > 0 && !newBranchId) {
      setNewBranchId(branches[0].id);
    }
  }, [branches, newBranchId]);

  // Helper to test if cashier is online
  const isCashierOnline = (c: Cashier) => c.last_sync_status === 'SUCCESS' || c.last_sync_status === 'ONLINE';

  // Add Cashier Mutation
  const addCashierMutation = useMutation({
    mutationFn: (data: { branch_id: string; name: string; ip_address: string; ssh_port: number; ssh_username: string; ssh_password: string }) =>
      topologyApi.createCashier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setAddCashierModalOpen(false);
      setNewName('');
      setNewIp('');
      setNewPort(22);
      setNewSshUsername('');
      setNewSshPassword('');
      setAddError(null);
    },
    onError: (err: any) => {
      setAddError(err.message || 'Ошибка добавления кассы');
    }
  });

  // Edit Cashier Handlers & Mutation
  const handleOpenEdit = (c: Cashier) => {
    if (!canManageDevices) return;
    setEditingCashier(c);
    setEditName(c.name);
    setEditIp(c.ip_address);
    setEditPort(c.ssh_port || 22);
    setEditBranchId(c.branch_id);
    setEditSshUsername(c.ssh_username || '');
    setEditSshPassword('');
    setEditError(null);
  };

  const updateCashierMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      topologyApi.updateCashier(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setEditingCashier(null);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Ошибка обновления кассы');
    }
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashier) return;
    if (!editName.trim() || !editIp.trim() || !editBranchId) {
      setEditError('Заполните обязательные поля: Название, IP-адрес, Ресторан');
      return;
    }
    const payload: any = {
      name: editName.trim(),
      ip_address: editIp.trim(),
      ssh_port: editPort,
      branch_id: editBranchId,
    };
    if (editSshUsername.trim()) {
      payload.ssh_username = editSshUsername.trim();
    }
    if (editSshPassword.trim()) {
      payload.ssh_password = editSshPassword.trim();
    }
    updateCashierMutation.mutate({ id: editingCashier.id, payload });
  };

  // Delete Cashier Mutation
  const deleteCashierMutation = useMutation({
    mutationFn: (id: string) => topologyApi.deleteCashier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
    },
    onError: (err: any) => {
      alert(`Ошибка удаления кассы: ${err.message}`);
    }
  });

  // Connection Test Mutation
  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => {
      setTestingId(id);
      return topologyApi.testConnection(id);
    },
    onSuccess: (res, id) => {
      setTestingId(null);
      setTestResult({ id, res });
      queryClient.invalidateQueries({ queryKey: ['cashiers'] });
      setTimeout(() => setTestResult(null), 6000);
    },
    onError: (err: any) => {
      setTestingId(null);
      alert(`Ошибка проверки связи: ${err.message}`);
    }
  });

  // Helper for numeric IP parsing
  const parseIp = (ip: string): number[] => {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    if (parts.length === 4 && parts.every(p => !isNaN(p))) {
      return parts;
    }
    return [0, 0, 0, 0];
  };

  const compareIps = (ipA: string, ipB: string): number => {
    const a = parseIp(ipA);
    const b = parseIp(ipB);
    for (let i = 0; i < 4; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
  };

  const getStatusRank = (c: Cashier): number => {
    if (isCashierOnline(c)) return 4;
    if (c.last_sync_status === 'PENDING' || c.last_sync_status === 'PUBLISHED_AWAITING_RESTART') return 3;
    if (c.last_sync_status === 'FAILED') return 2;
    return 1; // OFFLINE
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortField(field);
      if (field === 'status' || field === 'last_seen') {
        setSortDirection('desc'); // Online first, Newest first
      } else {
        setSortDirection('asc'); // A-Z, IP ascending
      }
    }
  };

  // Filter & Search cashiers (Multi-criteria engine with sorting)
  const filteredCashiers = useMemo(() => {
    const result = cashiers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const branch = branchMap.get(c.branch_id);
      const region = branch ? regionMap.get(branch.region_id) : undefined;
      const ver = c.guest_screen_version || '3.1.1.0';

      // 1. Text Search across IP, Name, Branch, Region, Version
      if (q) {
        const matchesQuery = 
          c.ip_address.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (branch && branch.name.toLowerCase().includes(q)) ||
          (region && region.name.toLowerCase().includes(q)) ||
          ver.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'ONLINE' && !isCashierOnline(c)) return false;
      if (statusFilter === 'OFFLINE' && (isCashierOnline(c) || c.last_sync_status === 'FAILED' || c.last_sync_status === 'PENDING' || c.last_sync_status === 'PUBLISHED_AWAITING_RESTART')) return false;
      if (statusFilter === 'FAILED' && c.last_sync_status !== 'FAILED') return false;
      if (statusFilter === 'PENDING' && (c.last_sync_status !== 'PENDING' && c.last_sync_status !== 'PUBLISHED_AWAITING_RESTART')) return false;

      // 3. GuestScreen Version Filter
      if (versionFilter !== 'ALL' && ver !== versionFilter) return false;

      // 4. Branch Filter
      if (branchFilter !== 'ALL' && c.branch_id !== branchFilter) return false;

      return true;
    });

    // 5. Sorting (Default: Branch name А-Я)
    const activeSortField = sortField || 'branch';
    const activeSortDir = sortDirection || 'asc';

    result.sort((a, b) => {
      let cmp = 0;
      if (activeSortField === 'branch') {
        const branchA = branchMap.get(a.branch_id)?.name || '';
        const branchB = branchMap.get(b.branch_id)?.name || '';
        cmp = branchA.localeCompare(branchB, 'ru');
        if (cmp === 0) {
          cmp = a.name.localeCompare(b.name, 'ru', { numeric: true });
        }
        if (cmp === 0) {
          cmp = compareIps(a.ip_address, b.ip_address);
        }
      } else if (activeSortField === 'status') {
        cmp = getStatusRank(a) - getStatusRank(b);
        if (cmp === 0) {
          const branchA = branchMap.get(a.branch_id)?.name || '';
          const branchB = branchMap.get(b.branch_id)?.name || '';
          cmp = branchA.localeCompare(branchB, 'ru');
        }
      } else if (activeSortField === 'name') {
        cmp = a.name.localeCompare(b.name, 'ru', { numeric: true });
      } else if (activeSortField === 'ip') {
        cmp = compareIps(a.ip_address, b.ip_address);
      } else if (activeSortField === 'version') {
        const verA = a.guest_screen_version || '3.1.1.0';
        const verB = b.guest_screen_version || '3.1.1.0';
        cmp = verA.localeCompare(verB);
      } else if (activeSortField === 'last_seen') {
        const timeA = new Date(a.last_seen_at || a.updated_at || 0).getTime();
        const timeB = new Date(b.last_seen_at || b.updated_at || 0).getTime();
        cmp = timeA - timeB;
      }

      return activeSortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [cashiers, searchQuery, statusFilter, versionFilter, branchFilter, branchMap, regionMap, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCashiers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Fleet Statistics
  const totalCount = cashiers.length;
  const onlineCount = cashiers.filter(isCashierOnline).length;
  const offlineCount = cashiers.filter(c => !isCashierOnline(c) && c.last_sync_status !== 'FAILED' && c.last_sync_status !== 'PENDING' && c.last_sync_status !== 'PUBLISHED_AWAITING_RESTART').length;
  const failedCount = cashiers.filter(c => c.last_sync_status === 'FAILED').length;
  const pendingCount = cashiers.filter(c => c.last_sync_status === 'PENDING' || c.last_sync_status === 'PUBLISHED_AWAITING_RESTART').length;

  const hasActiveFilters = statusFilter !== 'ALL' || versionFilter !== 'ALL' || branchFilter !== 'ALL' || searchQuery.trim() !== '' || (sortField !== 'branch' || sortDirection !== 'asc');

  const resetAllFilters = () => {
    setStatusFilter('ALL');
    setVersionFilter('ALL');
    setBranchFilter('ALL');
    setSearchQuery('');
    setSortField('branch');
    setSortDirection('asc');
    setSearchParams({}, { replace: true });
  };

  const handleConfigureAdForCashier = (cashierId: string) => {
    setAdConfigInitialCashierIds([cashierId]);
    setAdConfigOpen(true);
  };

  const handleConfigureAdForSelected = () => {
    setAdConfigInitialCashierIds(selectedIds);
    setAdConfigOpen(true);
  };

  const handleOpenDetails = (c: Cashier) => {
    setDetailCashier(c);
  };

  const handleDeleteCashier = (c: Cashier) => {
    if (!canManageDevices) return;
    if (window.confirm(`Вы уверены, что хотите удалить кассу "${c.name}" (${c.ip_address})?`)) {
      deleteCashierMutation.mutate(c.id);
    }
  };

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Title and Global Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Устройства</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold glass-surface-l1 text-[#A9DFD8] border border-glass-subtle flex items-center gap-1.5 shadow-sm">
              <img src={brand.emblem} className="w-3.5 h-3.5 rounded object-contain" alt="" />
              {brand.name} • {totalCount} касс
            </span>
            {isConnected && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold glass-surface-l1 text-[#05C168] border border-[#05C168]/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#05C168] animate-pulse" />
                Live Sync
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Центральное управление парком кассовых экранов GuestScreen, мониторинг состояния и доставка рекламы
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          {selectedIds.length > 0 && (
            <button
              onClick={handleConfigureAdForSelected}
              className="px-4 py-2.5 rounded-xl text-xs font-bold glass-btn-primary flex items-center space-x-2 shadow-lg liquid-interactive relative overflow-hidden"
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
              <Send className="w-3.5 h-3.5" />
              <span>Применить рекламу ({selectedIds.length})</span>
            </button>
          )}

          {canManageDevices && (
            <button
              onClick={() => setAddCashierModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold glass-btn-primary flex items-center space-x-2 shadow-lg liquid-interactive relative overflow-hidden"
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
              <Plus className="w-4 h-4" />
              <span>Добавить кассу</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Signature Liquid Glass KPI Summary Cluster */}
      <div className="glass-surface-l2 rounded-2xl p-5 shadow-glass-l2 glass-specular-edge liquid-chromatic-edge relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Состояние парка касс</h2>
            <p className="text-xs text-slate-400">Мониторинг кассового оборудования и экранов в реальном времени</p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center space-x-1.5 text-xs text-[#A9DFD8] hover:underline transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить фильтры</span>
            </button>
          )}
        </div>

        {/* 4 Cards inside Liquid Glass container */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          
          {/* 1. Всего касс */}
          <div 
            onClick={() => {
              setStatusFilter('ALL');
              if (searchParams.has('status')) {
                searchParams.delete('status');
                setSearchParams(searchParams, { replace: true });
              }
            }}
            className={`cursor-pointer glass-surface-l1 rounded-xl p-4 transition-all border liquid-interactive relative overflow-hidden ${
              statusFilter === 'ALL' 
                ? 'border-[#A9DFD8] ring-1 ring-[#A9DFD8]/40 bg-gradient-to-b from-[#A9DFD8]/10 to-transparent shadow-lg' 
                : 'border-glass-subtle hover:border-[#A9DFD8]/50 hover:bg-white/[0.04]'
            }`}
            title="Показать все устройства"
          >
            <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Всего касс</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#A9DFD8]">
                <Monitor className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
            <div className="text-[11px] text-[#A9DFD8] font-mono mt-1 flex items-center gap-1">
              <span>●</span> Все устройства
            </div>
          </div>

          {/* 2. В сети (Онлайн) */}
          <div 
            onClick={() => {
              const next = statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE';
              setStatusFilter(next);
              if (next === 'ALL') {
                searchParams.delete('status');
              } else {
                searchParams.set('status', next);
              }
              setSearchParams(searchParams, { replace: true });
            }}
            className={`cursor-pointer glass-surface-l1 rounded-xl p-4 transition-all border liquid-interactive relative overflow-hidden ${
              statusFilter === 'ONLINE' 
                ? 'border-[#05C168] ring-1 ring-[#05C168]/40 bg-gradient-to-b from-[#05C168]/10 to-transparent shadow-lg' 
                : 'border-glass-subtle hover:border-[#05C168]/50 hover:bg-white/[0.04]'
            }`}
            title="Кликните, чтобы отфильтровать кассы онлайн"
          >
            <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#05C168]/30 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">В сети</span>
              <div className="w-8 h-8 rounded-xl bg-[#05C168]/15 flex items-center justify-center text-[#05C168]">
                <Wifi className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#05C168] font-mono">{onlineCount}</div>
            <div className="text-[11px] text-[#05C168] font-mono mt-1 flex items-center gap-1">
              <span className="animate-pulse">●</span> Онлайн (активны)
            </div>
          </div>

          {/* 3. Не в сети (Офлайн) */}
          <div 
            onClick={() => {
              const next = statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE';
              setStatusFilter(next);
              if (next === 'ALL') {
                searchParams.delete('status');
              } else {
                searchParams.set('status', next);
              }
              setSearchParams(searchParams, { replace: true });
            }}
            className={`cursor-pointer glass-surface-l1 rounded-xl p-4 transition-all border liquid-interactive relative overflow-hidden ${
              statusFilter === 'OFFLINE' 
                ? 'border-[#FF5B5B] ring-1 ring-[#FF5B5B]/40 bg-gradient-to-b from-[#FF5B5B]/10 to-transparent shadow-lg' 
                : 'border-glass-subtle hover:border-[#FF5B5B]/50 hover:bg-white/[0.04]'
            }`}
            title="Кликните, чтобы отфильтровать кассы офлайн"
          >
            <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF5B5B]/30 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Не в сети</span>
              <div className="w-8 h-8 rounded-xl bg-[#FF5B5B]/15 flex items-center justify-center text-[#FF5B5B]">
                <WifiOff className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#FF5B5B] font-mono">{offlineCount}</div>
            <div className="text-[11px] text-[#FF5B5B] font-mono mt-1 flex items-center gap-1">
              <span>●</span> Нет связи
            </div>
          </div>

          {/* 4. Ошибки / Очередь */}
          <div 
            onClick={() => {
              const next = statusFilter === 'FAILED' ? 'ALL' : 'FAILED';
              setStatusFilter(next);
              if (next === 'ALL') {
                searchParams.delete('status');
              } else {
                searchParams.set('status', next);
              }
              setSearchParams(searchParams, { replace: true });
            }}
            className={`cursor-pointer glass-surface-l1 rounded-xl p-4 transition-all border liquid-interactive relative overflow-hidden ${
              statusFilter === 'FAILED' 
                ? 'border-[#3b82f6] ring-1 ring-[#3b82f6]/40 bg-gradient-to-b from-[#3b82f6]/10 to-transparent shadow-lg' 
                : 'border-glass-subtle hover:border-[#3b82f6]/50 hover:bg-white/[0.04]'
            }`}
            title="Кликните, чтобы отфильтровать кассы со сбоями или в очереди"
          >
            <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#3b82f6]/30 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">Сбои / Очередь</span>
              <div className="w-8 h-8 rounded-xl bg-[#3b82f6]/15 flex items-center justify-center text-[#3b82f6]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#3b82f6] font-mono">{failedCount + pendingCount}</div>
            <div className="text-[11px] text-[#3b82f6] font-mono mt-1 flex items-center gap-1">
              <span>●</span> Требуют внимания
            </div>
          </div>

        </div>
      </div>

      {/* 3. Comprehensive Filter & Search Toolbar */}
      <div className="glass-surface-l2 rounded-2xl p-4 shadow-glass-l2 glass-specular-edge space-y-3">
        
        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по IP, названию, филиалу, версии..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input rounded-xl pl-10 pr-8 py-2 text-xs placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    if (searchParams.has('search')) {
                      searchParams.delete('search');
                      setSearchParams(searchParams, { replace: true });
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="glass-input text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL">Все статусы</option>
                <option value="ONLINE">В сети (Online)</option>
                <option value="OFFLINE">Не в сети (Offline)</option>
                <option value="FAILED">Ошибки (Failed)</option>
                <option value="PENDING">Очередь / Рестарт</option>
              </select>
            </div>

            {/* GuestScreen Version Dropdown */}
            <div className="relative">
              <select
                value={versionFilter}
                onChange={(e) => setVersionFilter(e.target.value)}
                className="glass-input text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none cursor-pointer font-medium font-mono"
              >
                <option value="ALL">Все версии GS</option>
                {availableVersions.map(v => (
                  <option key={v} value={v}>Версия {v}</option>
                ))}
              </select>
            </div>

            {/* Branch / Restaurant Dropdown */}
            <div className="relative">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="glass-input text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL">Все рестораны</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Status Sort Button */}
            {/* Quick Branch Sort Button */}
            <button
              onClick={() => handleSort('branch')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border cursor-pointer ${
                sortField === 'branch' && sortDirection === 'asc'
                  ? 'bg-[#A9DFD8]/20 border-[#A9DFD8]/50 text-[#A9DFD8]'
                  : 'glass-surface-l1 border-glass-subtle text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Сортировать по названию филиала (А-Я)"
            >
              <Building2 className="w-3.5 h-3.5 text-[#A9DFD8]" />
              <span>Филиал (А-Я)</span>
              {sortField === 'branch' && (
                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#A9DFD8]" /> : <ArrowDown className="w-3 h-3 text-[#A9DFD8]" />
              )}
            </button>

            {/* Quick Status Sort Button */}
            <button
              onClick={() => handleSort('status')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border cursor-pointer ${
                sortField === 'status' && sortDirection === 'desc'
                  ? 'bg-[#05C168]/20 border-[#05C168]/50 text-[#05C168]'
                  : 'glass-surface-l1 border-glass-subtle text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Сортировать: кассы онлайн вверх"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#05C168] animate-pulse" />
              <span>В сети вверх</span>
              {sortField === 'status' && (
                sortDirection === 'desc' ? <ArrowUp className="w-3 h-3 text-[#05C168]" /> : <ArrowDown className="w-3 h-3 text-[#FF5B5B]" />
              )}
            </button>

          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center space-x-2 self-end lg:self-auto">
            {/* Refresh */}
            <button
              onClick={() => refetchCashiers()}
              disabled={loadingCashiers}
              className="p-2 glass-surface-l1 hover:bg-white/10 border border-glass-subtle rounded-xl text-slate-300 hover:text-white transition-colors"
              title="Обновить список касс"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCashiers ? 'animate-spin text-[#A9DFD8]' : ''}`} />
            </button>

            {/* Grid / Table Toggle */}
            <div className="flex items-center glass-surface-l1 border border-glass-subtle rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'glass-active-capsule text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Таблица"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'glass-active-capsule text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                title="Сетка"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Active Filter Chips & Counter (When filters applied) */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-glass-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mr-1">Активные фильтры:</span>
              
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full glass-surface-l1 text-white border border-glass-subtle">
                  <span>Статус: <strong>{statusFilter === 'ONLINE' ? 'В сети' : statusFilter === 'OFFLINE' ? 'Не в сети' : statusFilter === 'FAILED' ? 'Ошибка' : 'Очередь'}</strong></span>
                  <button onClick={() => setStatusFilter('ALL')} className="text-slate-400 hover:text-white">✕</button>
                </span>
              )}

              {versionFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full glass-surface-l1 text-[#A9DFD8] border border-glass-subtle font-mono">
                  <span>Версия: <strong>{versionFilter}</strong></span>
                  <button onClick={() => setVersionFilter('ALL')} className="text-slate-400 hover:text-white">✕</button>
                </span>
              )}

              {branchFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full glass-surface-l1 text-white border border-glass-subtle">
                  <span>Ресторан: <strong>{branchMap.get(branchFilter)?.name || branchFilter}</strong></span>
                  <button onClick={() => setBranchFilter('ALL')} className="text-slate-400 hover:text-white">✕</button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full glass-surface-l1 text-white border border-glass-subtle">
                  <span>Поиск: <strong>{searchQuery}</strong></span>
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">✕</button>
                </span>
              )}

              {(sortField !== 'branch' || sortDirection !== 'asc') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full glass-surface-l1 text-[#A9DFD8] border border-glass-subtle">
                  <span>Сортировка: <strong>
                    {sortField === 'status' ? (sortDirection === 'desc' ? 'В сети первые' : 'Офлайн первые') :
                     sortField === 'name' ? (sortDirection === 'asc' ? 'Касса (А-Я)' : 'Касса (Я-А)') :
                     sortField === 'ip' ? (sortDirection === 'asc' ? 'IP (возр.)' : 'IP (убыв.)') :
                     sortField === 'branch' ? (sortDirection === 'asc' ? 'Филиал (А-Я)' : 'Филиал (Я-А)') :
                     sortField === 'version' ? (sortDirection === 'desc' ? 'Версия (новые)' : 'Версия (старые)') :
                     (sortDirection === 'desc' ? 'Связь (свежие)' : 'Связь (старые)')}
                  </strong></span>
                  <button onClick={() => { setSortField('branch'); setSortDirection('asc'); }} className="text-slate-400 hover:text-white" title="Сбросить сортировку на Филиал (А-Я)">✕</button>
                </span>
              )}

              <button
                onClick={resetAllFilters}
                className="text-[11px] text-[#FF5B5B] hover:underline ml-2 font-medium"
              >
                Сбросить все фильтры
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Показано: <strong className="text-white">{filteredCashiers.length}</strong> из {cashiers.length} касс
            </div>
          </div>
        )}

      </div>

      {/* 4. Test Connection Result Toast */}
      {testResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs transition-all ${
          testResult.res.online 
            ? 'bg-[#05C168]/15 border-[#05C168]/30 text-emerald-300'
            : 'bg-[#FF5B5B]/15 border-[#FF5B5B]/30 text-rose-300'
        }`}>
          <div className="flex items-center space-x-2">
            {testResult.res.online ? <CheckCircle2 className="w-4 h-4 text-[#05C168]" /> : <AlertTriangle className="w-4 h-4 text-[#FF5B5B]" />}
            <span>
              <strong>SSH тест ({testResult.id}):</strong>{' '}
              {testResult.res.online 
                ? `Успешно! Отклик: ${testResult.res.response_time_ms} ms. GuestScreen: ${testResult.res.inspection?.guest_screen_version || 'N/A'}`
                : `Не удалось подключиться: ${testResult.res.error_message || 'Касса недоступна'}`}
            </span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 5. Main Content Area */}
      {filteredCashiers.length === 0 ? (
        <div className="glass-surface-l2 rounded-2xl p-12 text-center shadow-glass-l2 glass-specular-edge">
          <Monitor className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white mb-1">Кассы не найдены</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {hasActiveFilters 
              ? 'По вашим критериям фильтрации ничего не найдено. Нажмите "Сбросить фильтры", чтобы увидеть все кассы.'
              : 'В системе пока не добавлено ни одной кассы. Нажмите "+ Добавить кассу", чтобы зарегистрировать первое устройство.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold glass-btn-primary inline-flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить все фильтры</span>
            </button>
          ) : (
            <button
              onClick={() => setAddCashierModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold glass-btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить кассу</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        
        /* 6. TABLE VIEW */
        <div className="glass-surface-l2 rounded-2xl overflow-hidden shadow-glass-l2 glass-specular-edge">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-glass-subtle bg-white/[0.03] text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredCashiers.length && filteredCashiers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-glass-surface bg-slate-900/60 text-[#A9DFD8] focus:ring-[#A9DFD8]"
                    />
                  </th>
                  <th className="py-3.5 px-4 select-none">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1.5 font-semibold text-[#737791] hover:text-white transition-colors group cursor-pointer"
                        title="Сортировка по названию кассы (А-Я / Я-А)"
                      >
                        <span className={sortField === 'name' ? 'text-[#A9DFD8] font-bold' : ''}>Касса</span>
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#A9DFD8]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#A9DFD8]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-[#737791]/40 group-hover:text-white transition-colors" />
                        )}
                      </button>
                      <span className="text-[#2C2D3A]">|</span>
                      <button
                        type="button"
                        onClick={() => handleSort('ip')}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'ip' 
                            ? 'bg-[#A9DFD8] text-[#171821] font-bold shadow-sm' 
                            : 'text-[#87888C] hover:text-white hover:bg-[#171821] border border-[#2C2D3A]'
                        }`}
                        title="Сортировка по IP-адресу (1-255)"
                      >
                        <span>IP</span>
                        {sortField === 'ip' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />
                        ) : null}
                      </button>
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('branch')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#212330] hover:text-white transition-colors select-none group"
                    title="Сортировка по филиалу / ресторану (А-Я / Я-А)"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className={sortField === 'branch' ? 'text-[#A9DFD8] font-bold' : ''}>Филиал / Регион</span>
                      {sortField === 'branch' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#A9DFD8]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#A9DFD8]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#737791]/40 group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('version')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#212330] hover:text-white transition-colors select-none group"
                    title="Сортировка по версии GuestScreen"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className={sortField === 'version' ? 'text-[#A9DFD8] font-bold' : ''}>GuestScreen</span>
                      {sortField === 'version' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-[#A9DFD8]" /> : <ArrowUp className="w-3.5 h-3.5 text-[#A9DFD8]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#737791]/40 group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </th>
                  {isAdminOrSupervisor && (
                    <th className="py-3.5 px-4">Текущий контент</th>
                  )}
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#212330] hover:text-white transition-colors select-none group"
                    title="Сортировка по статусу (в сети первые / офлайн первые)"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={sortField === 'status' ? (sortDirection === 'desc' ? 'text-[#05C168] font-bold' : 'text-[#FF5B5B] font-bold') : ''}>
                        Статус
                      </span>
                      {sortField === 'status' ? (
                        sortDirection === 'desc' ? (
                          <span className="inline-flex items-center text-[#05C168] text-[10px] font-bold bg-[#05C168]/15 border border-[#05C168]/30 px-1.5 py-0.5 rounded-full">
                            <ArrowUp className="w-3 h-3 mr-0.5" /> В сети первые
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[#FF5B5B] text-[10px] font-bold bg-[#FF5B5B]/15 border border-[#FF5B5B]/30 px-1.5 py-0.5 rounded-full">
                            <ArrowDown className="w-3 h-3 mr-0.5" /> Офлайн первые
                          </span>
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#737791]/50 group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('last_seen')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-[#212330] hover:text-white transition-colors select-none group"
                    title="Сортировка по времени последней связи"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className={sortField === 'last_seen' ? 'text-[#A9DFD8] font-bold' : ''}>Последняя связь</span>
                      {sortField === 'last_seen' ? (
                        sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-[#A9DFD8]" /> : <ArrowUp className="w-3.5 h-3.5 text-[#A9DFD8]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#737791]/40 group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C2D3A]/60">
                {filteredCashiers.map((c) => {
                  const branch = branchMap.get(c.branch_id);
                  const region = branch ? regionMap.get(branch.region_id) : undefined;
                  const isSelected = selectedIds.includes(c.id);
                  const isTestingThis = testingId === c.id;
                  const isOnline = isCashierOnline(c);
                  const ver = c.guest_screen_version || '3.1.1.0';

                  // Active full screen & promo blocks
                  const fullBlock = c.current_full_screen_block_id ? adBlockMap.get(c.current_full_screen_block_id) : null;
                  const promoBlock = c.current_mode32_block_id ? adBlockMap.get(c.current_mode32_block_id) : null;

                  return (
                    <tr 
                      key={c.id}
                      className={`hover:bg-[#282A37] transition-colors ${isSelected ? 'bg-[#A9DFD8]/10' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(c.id)}
                          className="rounded border-white/20 bg-white/5 text-[#A9DFD8] focus:ring-[#A9DFD8]/40 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                            isOnline 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                              : 'bg-white/5 text-slate-400 border border-white/10'
                          }`}>
                            <Monitor className="w-4 h-4" />
                          </div>
                          <div>
                            <button
                              onClick={() => handleOpenDetails(c)}
                              className="font-bold text-white hover:text-[#A9DFD8] transition-colors text-left block"
                            >
                              {c.name}
                            </button>
                            {/* Clickable IP tag to filter by IP */}
                            <button
                              onClick={() => setSearchQuery(c.ip_address)}
                              title="Нажмите, чтобы отфильтровать по IP"
                              className="font-mono text-[11px] text-[#A9DFD8]/80 hover:text-[#A9DFD8] hover:underline block text-left"
                            >
                              {c.ip_address}:{c.ssh_port}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {/* Clickable Branch tag to filter by branch */}
                        <button
                          onClick={() => setBranchFilter(branchFilter === c.branch_id ? 'ALL' : c.branch_id)}
                          title="Нажмите, чтобы отфильтровать по ресторану"
                          className="text-white hover:text-[#A9DFD8] transition-colors font-medium text-left block"
                        >
                          {branch?.name || '—'}
                        </button>
                        <div className="text-[10px] text-slate-400">{region?.name || 'Ташкент'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {/* Clickable Version tag to filter by version */}
                        <button
                          onClick={() => setVersionFilter(versionFilter === ver ? 'ALL' : ver)}
                          title="Нажмите, чтобы отфильтровать по версии"
                          className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-white/5 text-[#A9DFD8] border border-white/10 hover:border-[#A9DFD8]/40 hover:bg-white/10 transition-all cursor-pointer block"
                        >
                          {ver}
                        </button>
                        {/* Hash visible only to admins/supervisors */}
                        {isAdminOrSupervisor && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5 truncate max-w-[140px]" title={`v${c.current_content_version || 1}`}>
                            v{c.current_content_version || 1}
                          </span>
                        )}
                      </td>

                      {/* Текущий контент — visible only to admins/supervisors */}
                      {isAdminOrSupervisor && (
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 max-w-[200px]">
                            <div className="flex items-center space-x-1 text-[11px] truncate" title={fullBlock?.name || 'По умолчанию'}>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">FULL</span>
                              <span className="text-slate-300 truncate">{fullBlock ? fullBlock.name : 'По умолчанию'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-[11px] truncate" title={promoBlock?.name || 'По умолчанию'}>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">50/50</span>
                              <span className="text-slate-300 truncate">{promoBlock ? promoBlock.name : 'По умолчанию'}</span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* CLICKABLE STATUS BADGE - Instant Filtering! */}
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
                            title="Нажмите для фильтрации: только В СЕТИ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            В СЕТИ
                          </button>
                        ) : c.last_sync_status === 'FAILED' ? (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
                            title="Нажмите для фильтрации: только ОШИБКИ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            ОШИБКА
                          </button>
                        ) : c.last_sync_status === 'PENDING' || c.last_sync_status === 'PUBLISHED_AWAITING_RESTART' ? (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                            title="Нажмите для фильтрации: только ОЧЕРЕДЬ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-indigo-400" />
                            ОЖИДАЕТ
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
                            title="Нажмите для фильтрации: только НЕ В СЕТИ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FF5B5B]/10 text-[#FF5B5B] border border-[#FF5B5B]/25 hover:bg-[#FF5B5B]/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B5B]" />
                            НЕ В СЕТИ
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {formatDateTime(c.last_seen_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Test SSH */}
                          <button
                            onClick={() => testConnectionMutation.mutate(c.id)}
                            disabled={isTestingThis}
                            className="p-1.5 bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Тест SSH связи"
                          >
                            <Activity className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-spin text-emerald-400' : ''}`} />
                          </button>

                          {/* Configure Ad */}
                          <button
                            onClick={() => handleConfigureAdForCashier(c.id)}
                            className="p-1.5 bg-white/5 hover:bg-[#A9DFD8]/15 border border-white/10 hover:border-[#A9DFD8]/30 rounded-lg text-slate-400 hover:text-[#A9DFD8] transition-colors"
                            title="Настроить рекламу"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          {canManageDevices && (
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                              title="Редактировать параметры"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Details */}
                          <button
                            onClick={() => handleOpenDetails(c)}
                            className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Карточка кассы"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {canManageDevices && (
                            <button
                              onClick={() => handleDeleteCashier(c)}
                              className="p-1.5 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 7. GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCashiers.map((c) => {
            const branch = branchMap.get(c.branch_id);
            const region = branch ? regionMap.get(branch.region_id) : undefined;
            const fullBlock = c.current_full_screen_block_id ? adBlockMap.get(c.current_full_screen_block_id) : null;
            const promoBlock = c.current_mode32_block_id ? adBlockMap.get(c.current_mode32_block_id) : null;
            const isTestingThis = testingId === c.id;
            const isOnline = isCashierOnline(c);
            const ver = c.guest_screen_version || '3.1.1.0';

            return (
              <div 
                key={c.id}
                className="glass-surface-l2 glass-specular-edge rounded-2xl p-5 flex flex-col justify-between hover:border-[#A9DFD8]/40 transition-all duration-300 shadow-xl group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                        isOnline 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm hover:text-[#A9DFD8] transition-colors cursor-pointer" onClick={() => handleOpenDetails(c)}>
                          {c.name}
                        </h4>
                        <button
                          onClick={() => setSearchQuery(c.ip_address)}
                          title="Кликните для фильтра по IP"
                          className="font-mono text-xs text-[#A9DFD8]/80 hover:text-[#A9DFD8] hover:underline block text-left"
                        >
                          {c.ip_address}:{c.ssh_port}
                        </button>
                      </div>
                    </div>
                    {/* Status Badge */}
                    {isOnline ? (
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-pointer shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                      >
                        В СЕТИ
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 cursor-pointer"
                      >
                        НЕ В СЕТИ
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs py-3 border-y border-white/[0.08] my-3">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Филиал:</span>
                      <button 
                        onClick={() => setBranchFilter(branchFilter === c.branch_id ? 'ALL' : c.branch_id)} 
                        className="text-white hover:text-[#A9DFD8] font-semibold transition-colors"
                      >
                        {branch?.name || '—'}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Регион:</span>
                      <span className="text-slate-200">{region?.name || 'Ташкент'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>GuestScreen:</span>
                      <button 
                        onClick={() => setVersionFilter(versionFilter === ver ? 'ALL' : ver)}
                        className="text-[#A9DFD8] font-mono font-bold hover:underline"
                      >
                        {ver}
                      </button>
                    </div>
                    {/* FULL блок and 50/50 промо — visible only to admins/supervisors */}
                    {isAdminOrSupervisor && (
                      <>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>FULL блок:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[130px]" title={fullBlock?.name}>
                            {fullBlock ? fullBlock.name : 'По умолчанию'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>50/50 промо:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[130px]" title={promoBlock?.name}>
                            {promoBlock ? promoBlock.name : 'По умолчанию'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] font-mono text-slate-400">
                    {formatDateTime(c.last_seen_at)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => testConnectionMutation.mutate(c.id)}
                      disabled={isTestingThis}
                      className="p-1.5 bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                      title="SSH тест"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-spin text-emerald-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleConfigureAdForCashier(c.id)}
                      className="p-1.5 bg-white/5 hover:bg-[#A9DFD8]/15 border border-white/10 hover:border-[#A9DFD8]/30 rounded-lg text-slate-400 hover:text-[#A9DFD8] transition-colors"
                      title="Реклама"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    {canManageDevices && (
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenDetails(c)}
                      className="p-1.5 bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Детали"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {canManageDevices && (
                      <button
                        onClick={() => handleDeleteCashier(c)}
                        className="p-1.5 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. Add Cashier Modal (Liquid Glass Level 4) */}
      {addCashierModalOpen && (
        <div className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#A9DFD8]/20 text-[#A9DFD8] flex items-center justify-center font-bold border border-[#A9DFD8]/30">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Добавить новую кассу</h3>
                  <p className="text-[11px] text-slate-400">Регистрация терминала GuestScreen для удаленного управления</p>
                </div>
              </div>
              <button onClick={() => setAddCashierModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim() || !newIp.trim() || !newBranchId) {
                setAddError('Заполните обязательные поля: Название, IP-адрес, Ресторан');
                return;
              }
              addCashierMutation.mutate({
                branch_id: newBranchId,
                name: newName.trim(),
                ip_address: newIp.trim(),
                ssh_port: newPort,
                ssh_username: newSshUsername.trim(),
                ssh_password: newSshPassword.trim(),
              });
            }} className="p-6 space-y-4 text-xs">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Название кассы *</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Касса №1 (Основной зал)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">IP адрес *</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.131.202"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="glass-input font-mono w-full px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">SSH Порт</label>
                  <input
                    type="number"
                    value={newPort}
                    onChange={(e) => setNewPort(parseInt(e.target.value) || 22)}
                    className="glass-input font-mono w-full px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Ресторан / Филиал *</label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white cursor-pointer focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">SSH логин</label>
                  <input
                    type="text"
                    placeholder="ucs (по умолч.)"
                    value={newSshUsername}
                    onChange={(e) => setNewSshUsername(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">SSH пароль</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newSshPassword}
                    onChange={(e) => setNewSshPassword(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-white/10 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setAddCashierModalOpen(false)}
                  className="glass-btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={addCashierMutation.isPending}
                  className="glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {addCashierMutation.isPending ? 'Сохранение...' : 'Зарегистрировать кассу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Edit Cashier Modal (Liquid Glass Level 4) */}
      {editingCashier && (
        <div className="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Редактировать кассу</h3>
                  <p className="text-[11px] text-slate-400">Изменение параметров подключения и привязки терминала</p>
                </div>
              </div>
              <button onClick={() => setEditingCashier(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Название кассы *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">IP адрес *</label>
                  <input
                    type="text"
                    required
                    value={editIp}
                    onChange={(e) => setEditIp(e.target.value)}
                    className="glass-input font-mono w-full px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">SSH Порт</label>
                  <input
                    type="number"
                    value={editPort}
                    onChange={(e) => setEditPort(parseInt(e.target.value) || 22)}
                    className="glass-input font-mono w-full px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Ресторан / Филиал *</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white cursor-pointer focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">SSH логин</label>
                  <input
                    type="text"
                    placeholder="Оставить прежний"
                    value={editSshUsername}
                    onChange={(e) => setEditSshUsername(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Новый SSH пароль</label>
                  <input
                    type="password"
                    placeholder="Оставьте пустым, если не меняется"
                    value={editSshPassword}
                    onChange={(e) => setEditSshPassword(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-white/10 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCashier(null)}
                  className="glass-btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={updateCashierMutation.isPending}
                  className="glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {updateCashierMutation.isPending ? 'Сохранение...' : 'Обновить параметры'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modals: Detail Modal & Ad Config Modal */}
      {detailCashier && (
        <DeviceDetailModal
          cashier={detailCashier}
          branches={branches}
          regions={regions}
          adBlocks={adBlocks}
          onClose={() => setDetailCashier(null)}
          onConfigureAd={(id) => {
            setDetailCashier(null);
            handleConfigureAdForCashier(id);
          }}
          onEdit={canManageDevices ? ((c) => {
            setDetailCashier(null);
            handleOpenEdit(c);
          }) : undefined}
        />
      )}

      {adConfigOpen && (
        <AdConfigModal
          initialCashierIds={adConfigInitialCashierIds}
          cashiers={cashiers}
          branches={branches}
          regions={regions}
          onClose={() => setAdConfigOpen(false)}
          onDispatched={(batchId) => {
            setAdConfigOpen(false);
            setActiveBatchId(batchId);
            queryClient.invalidateQueries({ queryKey: ['cashiers'] });
          }}
        />
      )}

      {activeBatchId && (
        <DeploymentProgressModal
          batchId={activeBatchId}
          onClose={() => setActiveBatchId(null)}
        />
      )}

    </div>
  );
};
