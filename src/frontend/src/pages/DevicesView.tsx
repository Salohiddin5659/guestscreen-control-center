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
  Building2,
  Download
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
  const [chartTab, setChartTab] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [rangePicker, setRangePicker] = useState<'7d' | '30d' | '90d'>('30d');

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

  const syncRate = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 100;
  const offlinePercent = totalCount > 0 ? ((offlineCount / totalCount) * 100).toFixed(1) : '0.0';

  const handleExportCSV = () => {
    const headers = ['Имя', 'IP', 'Порт', 'Филиал', 'Версия GS', 'Статус', 'Последняя связь'];
    const rows = filteredCashiers.map(c => [
      `"${c.name}"`,
      `"${c.ip_address}"`,
      (c as any).port || 22,
      `"${branchMap.get(c.branch_id)?.name || ''}"`,
      `"${c.guest_screen_version || '3.1.1.0'}"`,
      `"${c.last_sync_status || 'UNKNOWN'}"`,
      `"${formatDateTime(c.last_seen_at)}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cashiers_${brand.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">

      {/* ── Page Header (Exact Gentelella 2026 v4 index2.html) ── */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <div className="page-pretitle flex items-center gap-2">
              <span>ANALYTICS & FLEET CONTROL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1ABB9C] animate-pulse" />
              <span className="text-[10px] font-mono text-[#1ABB9C] font-semibold">Live Sync</span>
            </div>
            <h1 className="page-title flex items-center gap-3">
              <span>Traffic overview</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5">
                <img src={brand.emblem} className="w-3.5 h-3.5 rounded object-contain" alt="" />
                {brand.name} • {totalCount} касс
              </span>
            </h1>
          </div>

          <div className="page-actions">
            <div className="segmented" role="radiogroup" style={{ marginRight: 8 }}>
              <label>
                <input 
                  type="radio" 
                  name="rng" 
                  checked={rangePicker === '7d'} 
                  onChange={() => setRangePicker('7d')} 
                />
                <span>7d</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="rng" 
                  checked={rangePicker === '30d'} 
                  onChange={() => setRangePicker('30d')} 
                />
                <span>30d</span>
              </label>
              <label>
                <input 
                  type="radio" 
                  name="rng" 
                  checked={rangePicker === '90d'} 
                  onChange={() => setRangePicker('90d')} 
                />
                <span>90d</span>
              </label>
            </div>

            <button className="btn btn-outline" onClick={handleExportCSV} title="Экспорт реестра касс в CSV">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </button>

            {selectedIds.length > 0 && (
              <button className="btn btn-outline border-[#1ABB9C] text-[#1ABB9C]" onClick={handleConfigureAdForSelected}>
                <Send className="w-3.5 h-3.5 mr-1" />
                Реклама ({selectedIds.length})
              </button>
            )}

            {canManageDevices && (
              <button className="btn btn-primary" onClick={() => setAddCashierModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Добавить кассу
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 1: 4-up KPIs with Sparklines (Exact match to index2.html) ── */}
      <div className="row col-4">
        {/* Card 1: Visitors / Всего касс */}
        <div className="card">
          <div className="stat">
            <div className="stat-icon teal">
              <Monitor className="w-5 h-5 text-[#1ABB9C]" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Visitors (Всего касс)</div>
              <div className="stat-value-row">
                <span className="stat-value" style={{ color: 'var(--text)', fontWeight: 700 }}>{totalCount}</span>
                <span className="stat-change up">↑ 14%</span>
              </div>
              <div className="stat-subtext">vs last 30 days</div>
            </div>
            <div className="stat-spark">
              <div className="bar" style={{ height: '30%' }}></div>
              <div className="bar" style={{ height: '50%' }}></div>
              <div className="bar" style={{ height: '40%' }}></div>
              <div className="bar" style={{ height: '60%' }}></div>
              <div className="bar" style={{ height: '55%' }}></div>
              <div className="bar" style={{ height: '75%' }}></div>
              <div className="bar" style={{ height: '65%' }}></div>
              <div className="bar" style={{ height: '85%' }}></div>
              <div className="bar" style={{ height: '90%' }}></div>
              <div className="bar" style={{ height: '80%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: Bounce rate / Офлайн кассы */}
        <div className="card">
          <div className="stat">
            <div className="stat-icon red">
              <AlertTriangle className="w-5 h-5 text-[#d63939]" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Bounce rate (Офлайн)</div>
              <div className="stat-value-row">
                <span className="stat-value" style={{ color: 'var(--text)', fontWeight: 700 }}>{offlinePercent}%</span>
                <span className={`stat-change ${offlineCount > 0 ? 'down' : 'up'}`}>
                  {offlineCount > 0 ? `↓ ${offlineCount} касс` : '↓ 0.0pp'}
                </span>
              </div>
              <div className="stat-subtext">{offlineCount > 0 ? 'требуют связи' : 'improving (норма)'}</div>
            </div>
            <div className="stat-spark">
              <div className="bar" style={{ height: '80%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '75%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '60%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '65%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '55%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '50%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '45%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '40%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '42%', background: 'var(--red)' }}></div>
              <div className="bar" style={{ height: '38%', background: 'var(--red)' }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Conversions / В сети */}
        <div className="card">
          <div className="stat">
            <div className="stat-icon green">
              <CheckCircle2 className="w-5 h-5 text-[#2fb344]" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Conversions (В сети)</div>
              <div className="stat-value-row">
                <span className="stat-value" style={{ color: 'var(--text)', fontWeight: 700 }}>{onlineCount}</span>
                <span className="stat-change up">↑ {syncRate}%</span>
              </div>
              <div className="stat-subtext">{syncRate}% активного флота</div>
            </div>
            <div className="stat-spark">
              <div className="bar" style={{ height: '50%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '55%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '60%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '65%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '70%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '75%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '80%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '85%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '90%', background: 'var(--green)' }}></div>
              <div className="bar" style={{ height: '88%', background: 'var(--green)' }}></div>
            </div>
          </div>
        </div>

        {/* Card 4: Avg session / Рестораны */}
        <div className="card">
          <div className="stat">
            <div className="stat-icon purple">
              <Building2 className="w-5 h-5 text-[#ae3ec9]" />
            </div>
            <div className="stat-content">
              <div className="stat-label">Avg session (Рестораны)</div>
              <div className="stat-value-row">
                <span className="stat-value" style={{ color: 'var(--text)', fontWeight: 700 }}>{branches.length}</span>
                <span className="stat-change up">↑ 8%</span>
              </div>
              <div className="stat-subtext">филиалов сети {brand.name}</div>
            </div>
            <div className="stat-spark">
              <div className="bar" style={{ height: '50%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '55%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '60%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '65%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '70%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '75%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '80%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '85%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '90%', background: 'var(--purple)' }}></div>
              <div className="bar" style={{ height: '95%', background: 'var(--purple)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Live counter + Big Revenue Chart (Exact match to index2.html) ── */}
      <div className="row col-4-8">
        {/* Left: Live now card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Live now</div>
            <div className="card-subtitle">Текущий пульс кассового флота</div>
          </div>
          <div className="card-body" style={{ padding: '8px 16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: -1, color: 'var(--text)', lineHeight: 1 }}>
                {onlineCount}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-dot 2s infinite' }}></span>
                LIVE
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 14 }}>
              visitors right now ({onlineCount} касс активно)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11.5 }}>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Returning</div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>62%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Mobile</div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>48%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>From search</div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>71%</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Avg pages</div>
                <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 15 }}>4.2</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Revenue / Performance Chart card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Revenue</div>
              <div className="card-subtitle">$24,567 this month · ↑ 18% vs last month</div>
            </div>
            <div className="chart-tabs">
              <button className={`chart-tab ${chartTab === '7d' ? 'active' : ''}`} onClick={() => setChartTab('7d')}>7d</button>
              <button className={`chart-tab ${chartTab === '30d' ? 'active' : ''}`} onClick={() => setChartTab('30d')}>30d</button>
              <button className={`chart-tab ${chartTab === '90d' ? 'active' : ''}`} onClick={() => setChartTab('90d')}>90d</button>
              <button className={`chart-tab ${chartTab === '12m' ? 'active' : ''}`} onClick={() => setChartTab('12m')}>12m</button>
            </div>
          </div>
          <div className="chart-area" style={{ height: 240, padding: '16px 20px 8px' }}>
            <svg width="100%" height="200" viewBox="0 0 800 200" style={{ width: '100%', height: '100%', display: 'block' }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1ABB9C" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#1ABB9C" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              
              {/* Y Axis Grid lines and labels */}
              <line x1="45" y1="20" x2="790" y2="20" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="10" y="24" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font)">$35k</text>
              
              <line x1="45" y1="55" x2="790" y2="55" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="10" y="59" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font)">$30k</text>
              
              <line x1="45" y1="90" x2="790" y2="90" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="10" y="94" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font)">$25k</text>
              
              <line x1="45" y1="125" x2="790" y2="125" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="10" y="129" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font)">$20k</text>
              
              <line x1="45" y1="160" x2="790" y2="160" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="10" y="164" fill="var(--text-muted)" fontSize="10.5" fontFamily="var(--font)">$15k</text>

              {/* Area & Stroke */}
              <path 
                d="M 50,140 C 180,122 320,105 460,85 C 600,68 700,56 790,48 L 790,175 L 50,175 Z" 
                fill="url(#revenueGrad)" 
              />
              <path 
                d="M 50,140 C 180,122 320,105 460,85 C 600,68 700,56 790,48" 
                fill="none" 
                stroke="#1ABB9C" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* X Axis Months */}
              {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((month, idx) => (
                <text 
                  key={month} 
                  x={50 + idx * 67} 
                  y="192" 
                  fill="var(--text-muted)" 
                  fontSize="10" 
                  fontFamily="var(--font)" 
                  textAnchor="middle"
                >
                  {month}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* ── Row 3: Plan growth + Conversion funnel (Exact match to index2.html) ── */}
      <div className="row col-2">
        {/* Left: Plan growth card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Plan growth</div>
              <div className="card-subtitle">Stacked area · Pro · Business · Starter</div>
            </div>
          </div>
          <div className="chart-area" style={{ height: 240, padding: '16px 20px 8px' }}>
            <svg width="100%" height="200" viewBox="0 0 500 200" style={{ width: '100%', height: '100%', display: 'block' }}>
              <defs>
                <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1ABB9C" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#1ABB9C" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="bizGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4299E1" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#4299E1" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="starterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59F00" stopOpacity="0.30" />
                  <stop offset="100%" stopColor="#F59F00" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="35" y1="25" x2="490" y2="25" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="5" y="28" fill="var(--text-muted)" fontSize="9.5">70k</text>
              <line x1="35" y1="60" x2="490" y2="60" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="5" y="63" fill="var(--text-muted)" fontSize="9.5">50k</text>
              <line x1="35" y1="95" x2="490" y2="95" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="5" y="98" fill="var(--text-muted)" fontSize="9.5">30k</text>
              <line x1="35" y1="130" x2="490" y2="130" stroke="var(--border-color-light)" strokeDasharray="3 3" />
              <text x="5" y="133" fill="var(--text-muted)" fontSize="9.5">10k</text>

              {/* Starter layer (Orange / Top) */}
              <path d="M 40,110 C 130,105 240,88 340,70 C 420,55 460,45 490,40 L 490,165 L 40,165 Z" fill="url(#starterGrad)" />
              <path d="M 40,110 C 130,105 240,88 340,70 C 420,55 460,45 490,40" fill="none" stroke="#F59F00" strokeWidth="2" />

              {/* Business layer (Blue / Mid) */}
              <path d="M 40,125 C 130,120 240,105 340,90 C 420,78 460,70 490,65 L 490,165 L 40,165 Z" fill="url(#bizGrad)" />
              <path d="M 40,125 C 130,120 240,105 340,90 C 420,78 460,70 490,65" fill="none" stroke="#4299E1" strokeWidth="2" />

              {/* Pro layer (Teal / Base) */}
              <path d="M 40,145 C 130,140 240,130 340,120 C 420,112 460,108 490,105 L 490,165 L 40,165 Z" fill="url(#proGrad)" />
              <path d="M 40,145 C 130,140 240,130 340,120 C 420,112 460,108 490,105" fill="none" stroke="#1ABB9C" strokeWidth="2" />

              {/* X Months */}
              {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((m, i) => (
                <text key={m} x={40 + i * 40} y="180" fill="var(--text-muted)" fontSize="9" textAnchor="middle">{m}</text>
              ))}

              {/* Legend */}
              <g transform="translate(140, 196)">
                <circle cx="0" cy="-4" r="3.5" fill="#1ABB9C" />
                <text x="7" y="0" fill="var(--text-muted)" fontSize="9.5">Pro</text>
                <circle cx="50" cy="-4" r="3.5" fill="#4299E1" />
                <text x="57" y="0" fill="var(--text-muted)" fontSize="9.5">Business</text>
                <circle cx="120" cy="-4" r="3.5" fill="#F59F00" />
                <text x="127" y="0" fill="var(--text-muted)" fontSize="9.5">Starter</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right: Conversion funnel card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Conversion funnel</div>
              <div className="card-subtitle">Visitor → Paid</div>
            </div>
          </div>
          <div className="chart-area" style={{ height: 240, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100%" height="200" viewBox="0 0 460 200" style={{ width: '100%', height: '100%', display: 'block' }}>
              {/* Level 1: Visitors: 100 */}
              <polygon points="30,10 430,10 395,44 65,44" fill="#1ABB9C" />
              <text x="230" y="32" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle">Visitors: 100</text>

              {/* Level 2: Sign-ups: 62 */}
              <polygon points="68,48 392,48 360,82 100,82" fill="#3498DB" />
              <text x="230" y="70" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle">Sign-ups: 62</text>

              {/* Level 3: Activated: 38 */}
              <polygon points="103,86 357,86 325,120 135,120" fill="#9B59B6" />
              <text x="230" y="108" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle">Activated: 38</text>

              {/* Level 4: Trial: 18 */}
              <polygon points="138,124 322,124 290,158 170,158" fill="#F39C12" />
              <text x="230" y="146" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle">Trial: 18</text>

              {/* Level 5: Paid: 7 */}
              <polygon points="173,162 287,162 230,195" fill="#2FB344" />
              <text x="230" y="182" fill="#FFFFFF" fontSize="12" fontWeight="700" textAnchor="middle">Paid: 7</text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Row 4: Activity heatmap + Devices donut (Exact match to index2.html) ── */}
      <div className="row col-8-4">
        {/* Left: Activity heatmap card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Activity heatmap</div>
              <div className="card-subtitle">Sessions by hour and day-of-week</div>
            </div>
          </div>
          <div className="chart-area" style={{ height: 240, padding: '12px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(8, 1fr)', gap: 3, flex: 1 }}>
                {/* Heatmap Rows */}
                {[
                  { day: 'Sat', opacities: [0.35, 0.45, 0.55, 0.65, 0.75, 0.60, 0.50, 0.40] },
                  { day: 'Fri', opacities: [0.40, 0.50, 0.65, 0.85, 0.90, 0.75, 0.60, 0.45] },
                  { day: 'Thu', opacities: [0.35, 0.45, 0.60, 0.75, 0.80, 0.70, 0.55, 0.40] },
                  { day: 'Wed', opacities: [0.30, 0.40, 0.55, 0.70, 0.75, 0.65, 0.50, 0.35] },
                  { day: 'Tue', opacities: [0.30, 0.40, 0.50, 0.65, 0.70, 0.60, 0.45, 0.30] },
                  { day: 'Mon', opacities: [0.35, 0.45, 0.55, 0.60, 0.65, 0.55, 0.40, 0.30] },
                  { day: 'Sun', opacities: [0.25, 0.30, 0.40, 0.50, 0.55, 0.45, 0.35, 0.25] },
                ].map((row) => (
                  <React.Fragment key={row.day}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      {row.day}
                    </div>
                    {row.opacities.map((op, colIdx) => (
                      <div 
                        key={colIdx} 
                        style={{ 
                          background: `rgba(26, 187, 156, ${op})`, 
                          borderRadius: 2, 
                          height: 20 
                        }} 
                        title={`${row.day} intensity: ${(op * 100).toFixed(0)}%`}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>

              {/* Time axis */}
              <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(8, 1fr)', gap: 3, marginTop: 6 }}>
                <div></div>
                {['0:00', '3:00', '6:00', '9:00', '12:00', '15:00', '18:00', '21:00'].map((time) => (
                  <div key={time} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                    {time}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Devices donut card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Devices</div>
          </div>
          <div className="card-body">
            <div className="donut-block">
              <div className="donut-svg">
                <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Total circle length = 2 * PI * 42 = 263.9 */}
                  {/* iOS: 30% -> 79.2 */}
                  <circle cx="55" cy="55" r="42" fill="none" stroke="var(--primary)" strokeWidth="16" strokeDasharray="79.2 184.7" strokeDashoffset="0" />
                  {/* Android: 25% -> 66.0 */}
                  <circle cx="55" cy="55" r="42" fill="none" stroke="var(--azure)" strokeWidth="16" strokeDasharray="66.0 197.9" strokeDashoffset="-79.2" />
                  {/* Desktop: 20% -> 52.8 */}
                  <circle cx="55" cy="55" r="42" fill="none" stroke="var(--yellow)" strokeWidth="16" strokeDasharray="52.8 211.1" strokeDashoffset="-145.2" />
                  {/* Tablet: 15% -> 39.6 */}
                  <circle cx="55" cy="55" r="42" fill="none" stroke="var(--purple)" strokeWidth="16" strokeDasharray="39.6 224.3" strokeDashoffset="-198.0" />
                  {/* Other: 10% -> 26.4 */}
                  <circle cx="55" cy="55" r="42" fill="none" stroke="var(--red)" strokeWidth="16" strokeDasharray="26.4 237.5" strokeDashoffset="-237.6" />
                </svg>
                <div className="donut-center-label">
                  <div className="num">55%</div>
                  <div className="sub">mobile</div>
                </div>
              </div>
              <div className="donut-legend">
                <div className="donut-legend-item"><span className="dot" style={{ background: 'var(--primary)' }}></span> iOS <span className="pct">30%</span></div>
                <div className="donut-legend-item"><span className="dot" style={{ background: 'var(--azure)' }}></span> Android <span className="pct">25%</span></div>
                <div className="donut-legend-item"><span className="dot" style={{ background: 'var(--yellow)' }}></span> Desktop <span className="pct">20%</span></div>
                <div className="donut-legend-item"><span className="dot" style={{ background: 'var(--purple)' }}></span> Tablet <span className="pct">15%</span></div>
                <div className="donut-legend-item"><span className="dot" style={{ background: 'var(--red)' }}></span> Other <span className="pct">10%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Top pages + Top countries + Top referrers (Exact match to index2.html) ── */}
      <div className="row col-3">
        {/* Top pages */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top pages</div>
            <a href="#/devices" style={{ fontSize: 12 }}>View all</a>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th style={{ textAlign: 'right' }}>Views</th>
                    <th style={{ textAlign: 'right' }}>% chg</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>/pricing</td><td style={{ textAlign: 'right' }}>12,498</td><td style={{ textAlign: 'right' }}><span style={{ color: 'var(--green)' }}>+24%</span></td></tr>
                  <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>/features</td><td style={{ textAlign: 'right' }}>9,221</td><td style={{ textAlign: 'right' }}><span style={{ color: 'var(--green)' }}>+12%</span></td></tr>
                  <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>/blog/v4</td><td style={{ textAlign: 'right' }}>8,164</td><td style={{ textAlign: 'right' }}><span style={{ color: 'var(--green)' }}>+87%</span></td></tr>
                  <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>/docs</td><td style={{ textAlign: 'right' }}>6,432</td><td style={{ textAlign: 'right' }}><span style={{ color: 'var(--text-muted)' }}>+2%</span></td></tr>
                  <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>/login</td><td style={{ textAlign: 'right' }}>5,108</td><td style={{ textAlign: 'right' }}><span style={{ color: 'var(--red)' }}>−4%</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top countries */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top countries</div>
          </div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            <div className="visitor-row"><span className="visitor-flag">🇺🇸</span><span className="visitor-name">United States</span><span className="visitor-pct">42%</span><div className="visitor-bar"><div className="fill" style={{ width: '42%' }}></div></div></div>
            <div className="visitor-row"><span className="visitor-flag">🇩🇪</span><span className="visitor-name">Germany</span><span className="visitor-pct">21%</span><div className="visitor-bar"><div className="fill" style={{ width: '21%' }}></div></div></div>
            <div className="visitor-row"><span className="visitor-flag">🇯🇵</span><span className="visitor-name">Japan</span><span className="visitor-pct">14%</span><div className="visitor-bar"><div className="fill" style={{ width: '14%' }}></div></div></div>
            <div className="visitor-row"><span className="visitor-flag">🇧🇷</span><span className="visitor-name">Brazil</span><span className="visitor-pct">9%</span><div className="visitor-bar"><div className="fill" style={{ width: '9%' }}></div></div></div>
            <div className="visitor-row"><span className="visitor-flag">🇫🇷</span><span className="visitor-name">France</span><span className="visitor-pct">7%</span><div className="visitor-bar"><div className="fill" style={{ width: '7%' }}></div></div></div>
            <div className="visitor-row"><span className="visitor-flag">🇮🇳</span><span className="visitor-name">India</span><span className="visitor-pct">7%</span><div className="visitor-bar"><div className="fill" style={{ width: '7%' }}></div></div></div>
          </div>
        </div>

        {/* Top referrers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top referrers</div>
          </div>
          <div className="card-body" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0e1117', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>GH</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>github.com</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>8,432 visits</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>+34%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ff4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>PH</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>producthunt.com</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>3,210 visits</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>+12%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>𝕏</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>x.com</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>2,847 visits</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>+1%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#4285f4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>G</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500 }}>google.com</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>12,094 visits</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>+8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 6: Goals + Top searches + Cohort retention (Exact match to index2.html) ── */}
      <div className="row col-3">
        {/* Goals Card */}
        <div className="card">
          <div className="card-header"><div className="card-title">Goals</div></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>Sign-ups (Кассы)</span>
                <span style={{ color: 'var(--text-muted)' }}>{onlineCount} / {totalCount}</span>
              </div>
              <div className="progress-thin"><div className="bar" style={{ width: `${syncRate}%`, background: 'var(--primary)' }}></div></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>Trial conversions</span>
                <span style={{ color: 'var(--text-muted)' }}>87 / 100</span>
              </div>
              <div className="progress-thin"><div className="bar" style={{ width: '87%', background: 'var(--green)' }}></div></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>Newsletter (Связь)</span>
                <span style={{ color: 'var(--text-muted)' }}>2,140 / 3,000</span>
              </div>
              <div className="progress-thin"><div className="bar" style={{ width: '71%', background: 'var(--azure)' }}></div></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>Demo bookings</span>
                <span style={{ color: 'var(--text-muted)' }}>28 / 50</span>
              </div>
              <div className="progress-thin"><div className="bar" style={{ width: '56%', background: 'var(--yellow)' }}></div></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>Pro upgrades (Рестораны)</span>
                <span style={{ color: 'var(--text-muted)' }}>{branches.length} / {branches.length}</span>
              </div>
              <div className="progress-thin"><div className="bar" style={{ width: '100%', background: 'var(--purple)' }}></div></div>
            </div>
          </div>
        </div>

        {/* Top searches / Quick Filter Chips */}
        <div className="card">
          <div className="card-header"><div className="card-title">Top searches</div></div>
          <div className="card-body" style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('admin template')}>admin template <small style={{ marginLeft: 4, opacity: 0.6 }}>2.4k</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('free dashboard')}>free dashboard <small style={{ marginLeft: 4, opacity: 0.6 }}>1.8k</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('echarts')}>echarts <small style={{ marginLeft: 4, opacity: 0.6 }}>1.2k</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('vite tailwind')}>vite tailwind <small style={{ marginLeft: 4, opacity: 0.6 }}>980</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('bootstrap 5')}>bootstrap 5 <small style={{ marginLeft: 4, opacity: 0.6 }}>820</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('datatables')}>datatables <small style={{ marginLeft: 4, opacity: 0.6 }}>740</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('dark mode')}>dark mode <small style={{ marginLeft: 4, opacity: 0.6 }}>680</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('vanilla js')}>vanilla js <small style={{ marginLeft: 4, opacity: 0.6 }}>520</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('kanban')}>kanban <small style={{ marginLeft: 4, opacity: 0.6 }}>410</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('pricing tables')}>pricing tables <small style={{ marginLeft: 4, opacity: 0.6 }}>380</small></span>
            <span className="chip cursor-pointer" onClick={() => setSearchQuery('colorlib')}>colorlib <small style={{ marginLeft: 4, opacity: 0.6 }}>340</small></span>
            <span className="chip cursor-pointer" onClick={resetAllFilters}>2026 redesign <small style={{ marginLeft: 4, opacity: 0.6 }}>220</small></span>
          </div>
        </div>

        {/* Cohort retention table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cohort retention</div>
            <div className="card-subtitle" style={{ marginLeft: 8 }}>last 6 weeks</div>
          </div>
          <div className="card-body" style={{ padding: '0 16px 16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 500 }}>Cohort</th>
                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>W1</th>
                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>W2</th>
                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>W3</th>
                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>W4</th>
                  <th style={{ padding: '6px 4px', fontWeight: 500 }}>W5</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: 4, color: 'var(--text)', fontWeight: 500 }}>Apr 1</td>
                  <td style={{ padding: 3, background: 'var(--primary)', color: 'white', textAlign: 'center', fontWeight: 600 }}>100</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.7)', color: 'white', textAlign: 'center' }}>82</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.5)', color: 'white', textAlign: 'center' }}>71</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.4)', color: 'white', textAlign: 'center' }}>64</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.3)', color: 'white', textAlign: 'center' }}>58</td>
                </tr>
                <tr>
                  <td style={{ padding: 4, color: 'var(--text)', fontWeight: 500 }}>Apr 8</td>
                  <td style={{ padding: 3, background: 'var(--primary)', color: 'white', textAlign: 'center', fontWeight: 600 }}>100</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.65)', color: 'white', textAlign: 'center' }}>79</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.55)', color: 'white', textAlign: 'center' }}>68</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.4)', color: 'white', textAlign: 'center' }}>62</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                </tr>
                <tr>
                  <td style={{ padding: 4, color: 'var(--text)', fontWeight: 500 }}>Apr 15</td>
                  <td style={{ padding: 3, background: 'var(--primary)', color: 'white', textAlign: 'center', fontWeight: 600 }}>100</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.7)', color: 'white', textAlign: 'center' }}>85</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.55)', color: 'white', textAlign: 'center' }}>72</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                </tr>
                <tr>
                  <td style={{ padding: 4, color: 'var(--text)', fontWeight: 500 }}>Apr 22</td>
                  <td style={{ padding: 3, background: 'var(--primary)', color: 'white', textAlign: 'center', fontWeight: 600 }}>100</td>
                  <td style={{ padding: 3, background: 'rgba(26,187,156,0.75)', color: 'white', textAlign: 'center' }}>88</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                </tr>
                <tr>
                  <td style={{ padding: 4, color: 'var(--text)', fontWeight: 500 }}>Apr 29</td>
                  <td style={{ padding: 3, background: 'var(--primary)', color: 'white', textAlign: 'center', fontWeight: 600 }}>100</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                  <td style={{ padding: 3, background: 'var(--bg-surface-secondary)', color: 'var(--text-muted)', textAlign: 'center' }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Row 4: Devices Fleet Registry & Management Card ── */}
      <div className="card overflow-hidden">
        {/* Card Header */}
        <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="card-title flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#1ABB9C]" />
              <span>Реестр кассового оборудования</span>
              <span className="badge badge-teal">{filteredCashiers.length} из {cashiers.length}</span>
            </div>
            <div className="card-subtitle">Централизованный мониторинг касс, сетевых статусов и доставки рекламы</div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => refetchCashiers()}
              className="card-opt-btn"
              title="Обновить данные"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCashiers ? 'animate-spin text-[#1ABB9C]' : ''}`} />
            </button>
            <div className="flex items-center border border-[var(--border-color)] rounded p-0.5 bg-[var(--body-bg)]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded text-xs transition ${viewMode === 'table' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-400 hover:text-slate-700'}`}
                title="Таблица"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded text-xs transition ${viewMode === 'grid' ? 'bg-white shadow-sm font-bold text-slate-800' : 'text-slate-400 hover:text-slate-700'}`}
                title="Сетка"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-[var(--border-color-light)] bg-[var(--bg-surface-secondary)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Поиск по IP, имени, филиалу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[var(--border-color)] rounded focus:outline-none focus:border-[#1ABB9C]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs rounded border border-[var(--border-color)] bg-white px-2.5 py-1.5 focus:outline-none focus:border-[#1ABB9C] font-medium"
            >
              <option value="ALL">Все статусы</option>
              <option value="ONLINE">В сети (Online)</option>
              <option value="OFFLINE">Не в сети (Offline)</option>
              <option value="FAILED">Ошибки (Failed)</option>
              <option value="PENDING">Очередь / Рестарт</option>
            </select>

            {/* Version Dropdown */}
            <select
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              className="text-xs rounded border border-[var(--border-color)] bg-white px-2.5 py-1.5 focus:outline-none focus:border-[#1ABB9C] font-mono"
            >
              <option value="ALL">Все версии GS</option>
              {availableVersions.map(v => (
                <option key={v} value={v}>Версия {v}</option>
              ))}
            </select>

            {/* Branch Dropdown */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-xs rounded border border-[var(--border-color)] bg-white px-2.5 py-1.5 focus:outline-none focus:border-[#1ABB9C] font-medium max-w-[180px] truncate"
            >
              <option value="ALL">Все рестораны</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Quick Sort Buttons */}
            <button
              onClick={() => handleSort('branch')}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 border transition ${
                sortField === 'branch' && sortDirection === 'asc'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-[var(--border-color)] text-slate-600 hover:bg-slate-50'
              }`}
              title="Сортировать по названию филиала (А-Я)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Филиал (А-Я)</span>
            </button>

            <button
              onClick={() => handleSort('status')}
              className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center space-x-1 border transition ${
                sortField === 'status' && sortDirection === 'desc'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-[var(--border-color)] text-slate-600 hover:bg-slate-50'
              }`}
              title="Сортировать: кассы онлайн вверх"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1ABB9C] animate-pulse" />
              <span>В сети вверх</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-medium ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Сбросить</span>
              </button>
            )}
          </div>
        </div>

        {/* Test SSH Result Alert Toast */}
        {testResult && (
          <div className={`p-3 border-b text-xs flex items-center justify-between transition ${
            testResult.res.online ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center space-x-2">
              {testResult.res.online ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
              <span>
                <strong>SSH тест ({testResult.id}):</strong>{' '}
                {testResult.res.online 
                  ? `Успешно! Отклик: ${testResult.res.response_time_ms} ms. GuestScreen: ${testResult.res.inspection?.guest_screen_version || 'N/A'}`
                  : `Не удалось подключиться: ${testResult.res.error_message || 'Касса недоступна'}`}
              </span>
            </div>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}

        {/* ── TABLE VIEW ── */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-surface-secondary)] text-[var(--text-muted)] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredCashiers.length && filteredCashiers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-[var(--border-color)] text-[#1ABB9C] focus:ring-[#1ABB9C]"
                    />
                  </th>
                  <th className="py-2.5 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 font-bold text-[var(--text)] hover:text-[#1ABB9C] transition"
                      >
                        <span>Касса</span>
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      </button>
                      <span>|</span>
                      <button
                        type="button"
                        onClick={() => handleSort('ip')}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${sortField === 'ip' ? 'bg-[#1ABB9C] text-white font-bold' : 'text-slate-500 hover:text-slate-900 border border-slate-300'}`}
                      >
                        IP
                      </button>
                    </div>
                  </th>
                  <th className="py-2.5 px-4 cursor-pointer" onClick={() => handleSort('branch')}>
                    <div className="flex items-center space-x-1">
                      <span>Филиал / Регион</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 cursor-pointer" onClick={() => handleSort('version')}>
                    <div className="flex items-center space-x-1">
                      <span>GuestScreen</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  {isAdminOrSupervisor && <th className="py-2.5 px-4">Текущий контент</th>}
                  <th className="py-2.5 px-4 cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center space-x-1">
                      <span>Статус</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 cursor-pointer" onClick={() => handleSort('last_seen')}>
                    <div className="flex items-center space-x-1">
                      <span>Последняя связь</span>
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color-light)]">
                {filteredCashiers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Ни одной кассы не найдено по текущим фильтрам.
                    </td>
                  </tr>
                ) : (
                  filteredCashiers.map((c) => {
                    const branch = branchMap.get(c.branch_id);
                    const region = branch ? regionMap.get(branch.region_id) : undefined;
                    const isSelected = selectedIds.includes(c.id);
                    const isTestingThis = testingId === c.id;
                    const isOnline = isCashierOnline(c);
                    const ver = c.guest_screen_version || '3.1.1.0';
                    const fullBlock = c.current_full_screen_block_id ? adBlockMap.get(c.current_full_screen_block_id) : null;
                    const promoBlock = c.current_mode32_block_id ? adBlockMap.get(c.current_mode32_block_id) : null;

                    return (
                      <tr 
                        key={c.id}
                        className={`hover:bg-[#F9FAFB] transition ${isSelected ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className="py-2.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(c.id)}
                            className="rounded border-[var(--border-color)] text-[#1ABB9C] focus:ring-[#1ABB9C] cursor-pointer"
                          />
                        </td>

                        <td className="py-2.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                              isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              <Monitor className="w-4 h-4" />
                            </div>
                            <div>
                              <button
                                onClick={() => handleOpenDetails(c)}
                                className="font-bold text-[var(--text)] hover:text-[#1ABB9C] text-left block"
                              >
                                {c.name}
                              </button>
                              <button
                                onClick={() => setSearchQuery(c.ip_address)}
                                title="Кликните для фильтра по IP"
                                className="font-mono text-[11px] text-slate-500 hover:text-[#1ABB9C] block text-left"
                              >
                                {c.ip_address}:{c.ssh_port}
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => setBranchFilter(branchFilter === c.branch_id ? 'ALL' : c.branch_id)}
                            className="text-[var(--text)] hover:text-[#1ABB9C] font-medium text-left block"
                          >
                            {branch?.name || '—'}
                          </button>
                          <div className="text-[10px] text-slate-400">{region?.name || 'Ташкент'}</div>
                        </td>

                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => setVersionFilter(versionFilter === ver ? 'ALL' : ver)}
                            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 hover:border-[#1ABB9C] hover:text-[#1ABB9C] block"
                          >
                            {ver}
                          </button>
                        </td>

                        {isAdminOrSupervisor && (
                          <td className="py-2.5 px-4">
                            <div className="space-y-0.5 max-w-[180px]">
                              <div className="flex items-center space-x-1 text-[11px] truncate">
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 border">FULL</span>
                                <span className="text-slate-600 truncate">{fullBlock ? fullBlock.name : 'По умолчанию'}</span>
                              </div>
                              <div className="flex items-center space-x-1 text-[11px] truncate">
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 border">50/50</span>
                                <span className="text-slate-600 truncate">{promoBlock ? promoBlock.name : 'По умолчанию'}</span>
                              </div>
                            </div>
                          </td>
                        )}

                        <td className="py-2.5 px-4">
                          {isOnline ? (
                            <button
                              onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? 'ALL' : 'ONLINE')}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1ABB9C] animate-pulse" />
                              В СЕТИ
                            </button>
                          ) : (
                            <button
                              onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? 'ALL' : 'OFFLINE')}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shadow-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E74C3C]" />
                              НЕ В СЕТИ
                            </button>
                          )}
                        </td>

                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {formatDateTime(c.last_seen_at)}
                        </td>

                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => testConnectionMutation.mutate(c.id)}
                              disabled={isTestingThis}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-emerald-600 transition"
                              title="Тест SSH связи"
                            >
                              <Activity className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-spin text-emerald-600' : ''}`} />
                            </button>

                            <button
                              onClick={() => handleConfigureAdForCashier(c.id)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-[#1ABB9C] transition"
                              title="Настроить рекламу"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {canManageDevices && (
                              <button
                                onClick={() => handleOpenEdit(c)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-amber-600 transition"
                                title="Редактировать"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenDetails(c)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition"
                              title="Карточка кассы"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {canManageDevices && (
                              <button
                                onClick={() => handleDeleteCashier(c)}
                                className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── GRID VIEW ── */
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCashiers.map((c) => {
              const branch = branchMap.get(c.branch_id);
              const region = branch ? regionMap.get(branch.region_id) : undefined;
              const isTestingThis = testingId === c.id;
              const isOnline = isCashierOnline(c);
              const ver = c.guest_screen_version || '3.1.1.0';

              return (
                <div 
                  key={c.id}
                  className="bg-white border border-[var(--border-color)] rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                          isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--text)] text-xs hover:text-[#1ABB9C] cursor-pointer" onClick={() => handleOpenDetails(c)}>
                            {c.name}
                          </h4>
                          <button
                            onClick={() => setSearchQuery(c.ip_address)}
                            className="font-mono text-[11px] text-slate-500 hover:text-[#1ABB9C] block text-left"
                          >
                            {c.ip_address}:{c.ssh_port}
                          </button>
                        </div>
                      </div>
                      {isOnline ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          В СЕТИ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          НЕ В СЕТИ
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs py-2 border-y border-slate-100 my-2">
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Филиал:</span>
                        <span className="font-semibold text-slate-800">{branch?.name || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Регион:</span>
                        <span>{region?.name || 'Ташкент'}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500">
                        <span>Версия GS:</span>
                        <span className="font-mono font-bold text-[#1ABB9C]">{ver}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">
                      {formatDateTime(c.last_seen_at)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => testConnectionMutation.mutate(c.id)}
                        disabled={isTestingThis}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600"
                        title="Тест SSH"
                      >
                        <Activity className={`w-3.5 h-3.5 ${isTestingThis ? 'animate-spin text-emerald-600' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleConfigureAdForCashier(c.id)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#1ABB9C]"
                        title="Реклама"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      {canManageDevices && (
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-amber-600"
                          title="Редактировать"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

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
