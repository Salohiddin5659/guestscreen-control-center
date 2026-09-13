import React, { useState, useMemo } from 'react';
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
  ArrowDown
} from 'lucide-react';
import { 
  topologyApi, 
  advertisingApi, 
  Cashier, 
  Branch, 
  Region, 
  AdvertisingBlockListItem,
  ConnectionTestResult 
} from '../api/client';
import { useLiveFleet } from '../api/useLiveFleet';
import { DeviceDetailModal } from '../components/devices/DeviceDetailModal';
import { AdConfigModal } from '../components/config/AdConfigModal';
import { DeploymentProgressModal } from '../components/deployment/DeploymentProgressModal';

export const DevicesView: React.FC = () => {
  const queryClient = useQueryClient();
  const { isConnected } = useLiveFleet();

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Multi-criteria filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'FAILED' | 'PENDING'>('ALL');
  const [versionFilter, setVersionFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Sorting state
  type SortField = 'status' | 'name' | 'ip' | 'branch' | 'version' | 'last_seen';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

    // 5. Sorting
    if (sortField) {
      result.sort((a, b) => {
        let cmp = 0;
        if (sortField === 'status') {
          cmp = getStatusRank(a) - getStatusRank(b);
        } else if (sortField === 'name') {
          cmp = a.name.localeCompare(b.name, 'ru');
        } else if (sortField === 'ip') {
          cmp = compareIps(a.ip_address, b.ip_address);
        } else if (sortField === 'branch') {
          const branchA = branchMap.get(a.branch_id)?.name || '';
          const branchB = branchMap.get(b.branch_id)?.name || '';
          cmp = branchA.localeCompare(branchB, 'ru');
        } else if (sortField === 'version') {
          const verA = a.guest_screen_version || '3.1.1.0';
          const verB = b.guest_screen_version || '3.1.1.0';
          cmp = verA.localeCompare(verB);
        } else if (sortField === 'last_seen') {
          const timeA = new Date(a.last_seen_at || a.updated_at || 0).getTime();
          const timeB = new Date(b.last_seen_at || b.updated_at || 0).getTime();
          cmp = timeA - timeB;
        }

        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

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

  const hasActiveFilters = statusFilter !== 'ALL' || versionFilter !== 'ALL' || branchFilter !== 'ALL' || searchQuery.trim() !== '' || (sortField !== 'status' || sortDirection !== 'desc');

  const resetAllFilters = () => {
    setStatusFilter('ALL');
    setVersionFilter('ALL');
    setBranchFilter('ALL');
    setSearchQuery('');
    setSortField('status');
    setSortDirection('desc');
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#21222D] text-[#A9DFD8] border border-[#2C2D3A] flex items-center gap-1.5">
              <img src="/oqtepa_emblem.svg" className="w-3.5 h-3.5 rounded object-contain" alt="" />
              Oqtepa Lavash • {totalCount} касс
            </span>
            {isConnected && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#21222D] text-[#05C168] border border-[#05C168]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#05C168] animate-pulse" />
                Live Sync
              </span>
            )}
          </div>
          <p className="text-xs text-[#87888C] mt-1">
            Центральное управление парком кассовых экранов GuestScreen, мониторинг состояния и доставка рекламы
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          {selectedIds.length > 0 && (
            <button
              onClick={handleConfigureAdForSelected}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] shadow-lg shadow-[#A9DFD8]/20 flex items-center space-x-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Применить рекламу ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setAddCashierModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] shadow-lg shadow-[#A9DFD8]/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Добавить кассу</span>
          </button>
        </div>
      </div>

      {/* 2. Nickelfox Signature KPI Summary Card ("Today's Sales" Style) */}
      <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Состояние парка касс</h2>
            <p className="text-xs text-[#737791]">Интерактивная сводка мониторинга экранов GuestScreen (кликните для фильтрации)</p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center space-x-1.5 text-xs text-[#A9DFD8] hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить фильтры</span>
            </button>
          )}
        </div>

        {/* 4 Cards inside Nickelfox container */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          
          {/* 1. Всего касс */}
          <div 
            onClick={() => setStatusFilter('ALL')}
            className={`cursor-pointer bg-[#171821] rounded-xl p-4 transition-all border ${
              statusFilter === 'ALL' 
                ? 'border-[#FFB648] ring-1 ring-[#FFB648]/40 bg-[#1C1E2B]' 
                : 'border-[#2C2D3A] hover:border-[#FFB648]/60'
            }`}
            title="Показать все устройства"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#87888C]">Всего касс</span>
              <div className="w-8 h-8 rounded-xl bg-[#FFB648]/15 flex items-center justify-center text-[#FFB648]">
                <Monitor className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
            <div className="text-[11px] text-[#FFB648] font-mono mt-1 flex items-center gap-1">
              <span>●</span> Все устройства
            </div>
          </div>

          {/* 2. В сети (Онлайн) */}
          <div 
            onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
            className={`cursor-pointer bg-[#171821] rounded-xl p-4 transition-all border ${
              statusFilter === 'ONLINE' 
                ? 'border-[#05C168] ring-1 ring-[#05C168]/40 bg-[#1C1E2B]' 
                : 'border-[#2C2D3A] hover:border-[#05C168]/60'
            }`}
            title="Кликните, чтобы отфильтровать кассы онлайн"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#87888C]">В сети</span>
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
            onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
            className={`cursor-pointer bg-[#171821] rounded-xl p-4 transition-all border ${
              statusFilter === 'OFFLINE' 
                ? 'border-[#FF5B5B] ring-1 ring-[#FF5B5B]/40 bg-[#1C1E2B]' 
                : 'border-[#2C2D3A] hover:border-[#FF5B5B]/60'
            }`}
            title="Кликните, чтобы отфильтровать кассы офлайн"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#87888C]">Не в сети</span>
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
            onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
            className={`cursor-pointer bg-[#171821] rounded-xl p-4 transition-all border ${
              statusFilter === 'FAILED' 
                ? 'border-[#5D5FEF] ring-1 ring-[#5D5FEF]/40 bg-[#1C1E2B]' 
                : 'border-[#2C2D3A] hover:border-[#5D5FEF]/60'
            }`}
            title="Кликните, чтобы отфильтровать кассы со сбоями или в очереди"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#87888C]">Сбои / Очередь</span>
              <div className="w-8 h-8 rounded-xl bg-[#5D5FEF]/15 flex items-center justify-center text-[#5D5FEF]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-[#5D5FEF] font-mono">{failedCount + pendingCount}</div>
            <div className="text-[11px] text-[#5D5FEF] font-mono mt-1 flex items-center gap-1">
              <span>●</span> Требуют внимания
            </div>
          </div>

        </div>
      </div>

      {/* 3. Comprehensive Filter & Search Toolbar */}
      <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-4 shadow-xl space-y-3">
        
        {/* Main Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            
            {/* Search Input */}
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737791]" />
              <input
                type="text"
                placeholder="Поиск по IP, названию, филиалу, версии..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737791] hover:text-white"
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
                className="bg-[#171821] border border-[#2C2D3A] text-xs text-white rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#A9DFD8] transition-all cursor-pointer font-medium"
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
                className="bg-[#171821] border border-[#2C2D3A] text-xs text-white rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#A9DFD8] transition-all cursor-pointer font-medium font-mono"
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
                className="bg-[#171821] border border-[#2C2D3A] text-xs text-white rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-[#A9DFD8] transition-all cursor-pointer font-medium"
              >
                <option value="ALL">Все рестораны</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Status Sort Button */}
            <button
              onClick={() => handleSort('status')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all border cursor-pointer ${
                sortField === 'status' && sortDirection === 'desc'
                  ? 'bg-[#05C168]/15 border-[#05C168]/50 text-[#05C168]'
                  : 'bg-[#171821] border-[#2C2D3A] text-[#87888C] hover:text-white'
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
              className="p-2 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-xl text-[#87888C] hover:text-white transition-colors"
              title="Обновить список касс"
            >
              <RefreshCw className={`w-4 h-4 ${loadingCashiers ? 'animate-spin text-[#A9DFD8]' : ''}`} />
            </button>

            {/* Grid / Table Toggle */}
            <div className="flex items-center bg-[#171821] border border-[#2C2D3A] rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-[#21222D] text-white font-bold shadow-sm' : 'text-[#87888C] hover:text-white'}`}
                title="Таблица"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#21222D] text-white font-bold shadow-sm' : 'text-[#87888C] hover:text-white'}`}
                title="Сетка"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Active Filter Chips & Counter (When filters applied) */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-[#2C2D3A]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#737791] text-[11px] font-semibold uppercase tracking-wider mr-1">Активные фильтры:</span>
              
              {statusFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171821] text-white border border-[#2C2D3A]">
                  <span>Статус: <strong>{statusFilter === 'ONLINE' ? 'В сети' : statusFilter === 'OFFLINE' ? 'Не в сети' : statusFilter === 'FAILED' ? 'Ошибка' : 'Очередь'}</strong></span>
                  <button onClick={() => setStatusFilter('ALL')} className="text-[#87888C] hover:text-white">✕</button>
                </span>
              )}

              {versionFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171821] text-[#A9DFD8] border border-[#2C2D3A] font-mono">
                  <span>Версия: <strong>{versionFilter}</strong></span>
                  <button onClick={() => setVersionFilter('ALL')} className="text-[#87888C] hover:text-white">✕</button>
                </span>
              )}

              {branchFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171821] text-white border border-[#2C2D3A]">
                  <span>Ресторан: <strong>{branchMap.get(branchFilter)?.name || branchFilter}</strong></span>
                  <button onClick={() => setBranchFilter('ALL')} className="text-[#87888C] hover:text-white">✕</button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171821] text-white border border-[#2C2D3A]">
                  <span>Поиск: <strong>{searchQuery}</strong></span>
                  <button onClick={() => setSearchQuery('')} className="text-[#87888C] hover:text-white">✕</button>
                </span>
              )}

              {sortField && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171821] text-[#A9DFD8] border border-[#2C2D3A]">
                  <span>Сортировка: <strong>
                    {sortField === 'status' ? (sortDirection === 'desc' ? 'В сети первые' : 'Офлайн первые') :
                     sortField === 'name' ? (sortDirection === 'asc' ? 'Касса (А-Я)' : 'Касса (Я-А)') :
                     sortField === 'ip' ? (sortDirection === 'asc' ? 'IP (возр.)' : 'IP (убыв.)') :
                     sortField === 'branch' ? (sortDirection === 'asc' ? 'Филиал (А-Я)' : 'Филиал (Я-А)') :
                     sortField === 'version' ? (sortDirection === 'desc' ? 'Версия (новые)' : 'Версия (старые)') :
                     (sortDirection === 'desc' ? 'Связь (свежие)' : 'Связь (старые)')}
                  </strong></span>
                  <button onClick={() => { setSortField('status'); setSortDirection('desc'); }} className="text-[#87888C] hover:text-white" title="Сбросить сортировку">✕</button>
                </span>
              )}

              <button
                onClick={resetAllFilters}
                className="text-[11px] text-[#FF5B5B] hover:underline ml-2 font-medium"
              >
                Сбросить все фильтры
              </button>
            </div>

            <div className="text-[11px] font-mono text-[#87888C]">
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
          <button onClick={() => setTestResult(null)} className="text-[#87888C] hover:text-white">✕</button>
        </div>
      )}

      {/* 5. Main Content Area */}
      {filteredCashiers.length === 0 ? (
        <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-12 text-center shadow-xl">
          <Monitor className="w-12 h-12 text-[#737791] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-white mb-1">Кассы не найдены</h3>
          <p className="text-xs text-[#87888C] max-w-sm mx-auto mb-4">
            {hasActiveFilters 
              ? 'По вашим критериям фильтрации ничего не найдено. Нажмите "Сбросить фильтры", чтобы увидеть все кассы.'
              : 'В системе пока не добавлено ни одной кассы. Нажмите "+ Добавить кассу", чтобы зарегистрировать первое устройство.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] transition-colors inline-flex items-center space-x-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить все фильтры</span>
            </button>
          ) : (
            <button
              onClick={() => setAddCashierModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8ee0d6] transition-colors inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить кассу</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        
        /* 6. TABLE VIEW ("Top Products" Nickelfox Style) */
        <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#2C2D3A] bg-[#1A1C26] text-[#737791] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredCashiers.length && filteredCashiers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-[#2C2D3A] bg-[#171821] text-[#A9DFD8] focus:ring-[#A9DFD8]"
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
                  <th className="py-3.5 px-4">Текущий контент</th>
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
                          className="rounded border-[#2C2D3A] bg-[#171821] text-[#A9DFD8] focus:ring-[#A9DFD8]"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                            isOnline 
                              ? 'bg-[#05C168]/15 text-[#05C168] border border-[#05C168]/30' 
                              : 'bg-[#171821] text-[#737791] border border-[#2C2D3A]'
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
                              className="font-mono text-[11px] text-[#A9DFD8]/75 hover:text-[#A9DFD8] hover:underline block text-left"
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
                        <div className="text-[10px] text-[#737791]">{region?.name || 'Ташкент'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {/* Clickable Version tag to filter by version */}
                        <button
                          onClick={() => setVersionFilter(versionFilter === ver ? 'ALL' : ver)}
                          title="Нажмите, чтобы отфильтровать по версии"
                          className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-[#171821] text-[#A9DFD8] border border-[#2C2D3A] hover:border-[#A9DFD8] transition-all cursor-pointer block"
                        >
                          {ver}
                        </button>
                        <span className="text-[10px] text-[#737791] font-mono block mt-0.5">
                          v{c.current_content_version || 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[200px]">
                          <div className="flex items-center space-x-1 text-[11px] truncate" title={fullBlock?.name || 'По умолчанию'}>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171821] text-[#87888C] border border-[#2C2D3A]">FULL</span>
                            <span className="text-gray-300 truncate">{fullBlock ? fullBlock.name : 'По умолчанию'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-[11px] truncate" title={promoBlock?.name || 'По умолчанию'}>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171821] text-[#87888C] border border-[#2C2D3A]">50/50</span>
                            <span className="text-gray-300 truncate">{promoBlock ? promoBlock.name : 'По умолчанию'}</span>
                          </div>
                        </div>
                      </td>

                      {/* CLICKABLE STATUS BADGE - Instant Filtering! */}
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
                            title="Нажмите для фильтрации: только В СЕТИ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#05C168]/15 text-[#05C168] border border-[#05C168]/30 hover:bg-[#05C168]/25 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#05C168] animate-pulse" />
                            В СЕТИ
                          </button>
                        ) : c.last_sync_status === 'FAILED' ? (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
                            title="Нажмите для фильтрации: только ОШИБКИ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FF5B5B]/15 text-[#FF5B5B] border border-[#FF5B5B]/30 hover:bg-[#FF5B5B]/25 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3 text-[#FF5B5B]" />
                            ОШИБКА
                          </button>
                        ) : c.last_sync_status === 'PENDING' || c.last_sync_status === 'PUBLISHED_AWAITING_RESTART' ? (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                            title="Нажмите для фильтрации: только ОЧЕРЕДЬ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#5D5FEF]/15 text-[#5D5FEF] border border-[#5D5FEF]/30 hover:bg-[#5D5FEF]/25 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Clock className="w-3 h-3 text-[#5D5FEF]" />
                            ОЖИДАЕТ
                          </button>
                        ) : (
                          <button
                            onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
                            title="Нажмите для фильтрации: только НЕ В СЕТИ"
                            className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30 hover:bg-gray-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            НЕ В СЕТИ
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#87888C]">
                        {formatDateTime(c.last_seen_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Test SSH */}
                          <button
                            onClick={() => testConnectionMutation.mutate(c.id)}
                            disabled={isTestingThis}
                            className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-[#05C168] transition-colors"
                            title="Тест SSH связи"
                          >
                            <Activity className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-spin text-[#05C168]' : ''}`} />
                          </button>

                          {/* Configure Ad */}
                          <button
                            onClick={() => handleConfigureAdForCashier(c.id)}
                            className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-[#A9DFD8] transition-colors"
                            title="Настроить рекламу"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-[#FFB648] transition-colors"
                            title="Редактировать параметры"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Details */}
                          <button
                            onClick={() => handleOpenDetails(c)}
                            className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-white transition-colors"
                            title="Карточка кассы"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCashier(c)}
                            className="p-1.5 bg-[#171821] hover:bg-[#FF5B5B]/15 border border-[#2C2D3A] hover:border-[#FF5B5B]/30 rounded-lg text-[#737791] hover:text-[#FF5B5B] transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-5 flex flex-col justify-between hover:border-[#A9DFD8]/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm ${
                        isOnline 
                          ? 'bg-[#05C168]/15 text-[#05C168] border border-[#05C168]/30' 
                          : 'bg-[#171821] text-[#737791] border border-[#2C2D3A]'
                      }`}>
                        <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm hover:text-[#A9DFD8] cursor-pointer" onClick={() => handleOpenDetails(c)}>
                          {c.name}
                        </h4>
                        <button
                          onClick={() => setSearchQuery(c.ip_address)}
                          title="Кликните для фильтра по IP"
                          className="font-mono text-xs text-[#A9DFD8]/75 hover:text-[#A9DFD8] hover:underline block text-left"
                        >
                          {c.ip_address}:{c.ssh_port}
                        </button>
                      </div>
                    </div>
                    {/* Status Badge */}
                    {isOnline ? (
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#05C168]/15 text-[#05C168] border border-[#05C168]/30 cursor-pointer"
                      >
                        В СЕТИ
                      </button>
                    ) : (
                      <button
                        onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/30 cursor-pointer"
                      >
                        НЕ В СЕТИ
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs py-3 border-y border-[#2C2D3A]/60 my-3">
                    <div className="flex justify-between items-center text-[#87888C]">
                      <span>Филиал:</span>
                      <button 
                        onClick={() => setBranchFilter(branchFilter === c.branch_id ? 'ALL' : c.branch_id)} 
                        className="text-white hover:text-[#A9DFD8] font-semibold"
                      >
                        {branch?.name || '—'}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[#87888C]">
                      <span>Регион:</span>
                      <span className="text-gray-300">{region?.name || 'Ташкент'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#87888C]">
                      <span>GuestScreen:</span>
                      <button 
                        onClick={() => setVersionFilter(versionFilter === ver ? 'ALL' : ver)}
                        className="text-[#A9DFD8] font-mono font-bold hover:underline"
                      >
                        {ver}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[#87888C]">
                      <span>FULL блок:</span>
                      <span className="text-gray-300 font-medium truncate max-w-[130px]" title={fullBlock?.name}>
                        {fullBlock ? fullBlock.name : 'По умолчанию'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#87888C]">
                      <span>50/50 промо:</span>
                      <span className="text-gray-300 font-medium truncate max-w-[130px]" title={promoBlock?.name}>
                        {promoBlock ? promoBlock.name : 'По умолчанию'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[10px] font-mono text-[#737791]">
                    {formatDateTime(c.last_seen_at)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => testConnectionMutation.mutate(c.id)}
                      disabled={isTestingThis}
                      className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-[#05C168] transition-colors"
                      title="SSH тест"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-spin text-[#05C168]' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleConfigureAdForCashier(c.id)}
                      className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-[#A9DFD8] transition-colors"
                      title="Реклама"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-[#FFB648] transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDetails(c)}
                      className="p-1.5 bg-[#171821] hover:bg-[#282A37] border border-[#2C2D3A] rounded-lg text-[#87888C] hover:text-white transition-colors"
                      title="Детали"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCashier(c)}
                      className="p-1.5 bg-[#171821] hover:bg-[#FF5B5B]/15 border border-[#2C2D3A] hover:border-[#FF5B5B]/30 rounded-lg text-[#737791] hover:text-[#FF5B5B] transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. Add Cashier Modal (Nickelfox Dark Theme) */}
      {addCashierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2C2D3A] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#A9DFD8]/20 text-[#A9DFD8] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Добавить новую кассу</h3>
                  <p className="text-[11px] text-[#737791]">Регистрация терминала GuestScreen для удаленного управления</p>
                </div>
              </div>
              <button onClick={() => setAddCashierModalOpen(false)} className="p-1 text-[#87888C] hover:text-white">
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
                <div className="p-3 rounded-xl bg-[#FF5B5B]/15 border border-[#FF5B5B]/30 text-[#FF5B5B]">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[#87888C] font-semibold block mb-1">Название кассы *</label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Касса №1 (Основной зал)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">IP адрес *</label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.131.202"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white font-mono placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">SSH Порт</label>
                  <input
                    type="number"
                    value={newPort}
                    onChange={(e) => setNewPort(parseInt(e.target.value) || 22)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[#87888C] font-semibold block mb-1">Ресторан / Филиал *</label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#A9DFD8]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">SSH логин</label>
                  <input
                    type="text"
                    placeholder="ucs (по умолч.)"
                    value={newSshUsername}
                    onChange={(e) => setNewSshUsername(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">SSH пароль</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newSshPassword}
                    onChange={(e) => setNewSshPassword(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#2C2D3A] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddCashierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-white bg-[#171821] border border-[#2C2D3A] hover:bg-[#282A37]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={addCashierMutation.isPending}
                  className="px-4 py-2 rounded-xl text-[#171821] font-bold bg-[#A9DFD8] hover:bg-[#8ee0d6] shadow-md shadow-[#A9DFD8]/20 transition-all disabled:opacity-50"
                >
                  {addCashierMutation.isPending ? 'Сохранение...' : 'Зарегистрировать кассу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Edit Cashier Modal */}
      {editingCashier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#21222D] border border-[#2C2D3A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2C2D3A] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFB648]/20 text-[#FFB648] flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Редактировать кассу</h3>
                  <p className="text-[11px] text-[#737791]">{editingCashier.name} ({editingCashier.ip_address})</p>
                </div>
              </div>
              <button onClick={() => setEditingCashier(null)} className="p-1 text-[#87888C] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-[#FF5B5B]/15 border border-[#FF5B5B]/30 text-[#FF5B5B]">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[#87888C] font-semibold block mb-1">Название кассы *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">IP адрес *</label>
                  <input
                    type="text"
                    required
                    value={editIp}
                    onChange={(e) => setEditIp(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">SSH Порт</label>
                  <input
                    type="number"
                    value={editPort}
                    onChange={(e) => setEditPort(parseInt(e.target.value) || 22)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[#87888C] font-semibold block mb-1">Ресторан / Филиал *</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#A9DFD8]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">SSH логин</label>
                  <input
                    type="text"
                    placeholder="Оставить прежний"
                    value={editSshUsername}
                    onChange={(e) => setEditSshUsername(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>

                <div>
                  <label className="text-[#87888C] font-semibold block mb-1">Новый SSH пароль</label>
                  <input
                    type="password"
                    placeholder="Оставьте пустым, если не меняется"
                    value={editSshPassword}
                    onChange={(e) => setEditSshPassword(e.target.value)}
                    className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl px-3.5 py-2 text-white placeholder-[#737791] focus:outline-none focus:border-[#A9DFD8]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#2C2D3A] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingCashier(null)}
                  className="px-4 py-2 rounded-xl text-white bg-[#171821] border border-[#2C2D3A] hover:bg-[#282A37]"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={updateCashierMutation.isPending}
                  className="px-4 py-2 rounded-xl text-[#171821] font-bold bg-[#A9DFD8] hover:bg-[#8ee0d6] shadow-md shadow-[#A9DFD8]/20 transition-all disabled:opacity-50"
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
          onEdit={(c) => {
            setDetailCashier(null);
            handleOpenEdit(c);
          }}
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
