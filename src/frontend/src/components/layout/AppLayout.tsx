import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Monitor,
  Building2,
  Image,
  Film,
  Send,
  Users as UsersIcon,
  FileText,
  Settings as SettingsIcon,
  BookOpen,
  Menu,
  Search,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Server
} from 'lucide-react';
import { 
  authApi, 
  topologyApi, 
  usersApi, 
  apiRequest, 
  getCurrentUserFromStorage 
} from '../../api/client';
import { getBrand } from '../../utils/brand';

export const AppLayout: React.FC = () => {
  const brand = getBrand();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('gs_theme') as 'light' | 'dark') || 'light';
  });

  const [dashboardsOpen, setDashboardsOpen] = useState(true);
  const [adsOpen, setAdsOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Dynamic user data
  const { data: meData } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => authApi.me().catch(() => null),
  });
  const storedUser = getCurrentUserFromStorage();
  const user = meData || storedUser || { username: 'admin', role: 'ADMINISTRATOR', full_name: 'GS Administrator' };
  const userRole = (user?.role || '').toUpperCase();
  const isAdminOrSupervisor = userRole === 'ADMINISTRATOR' || userRole === 'ADMIN' || userRole === 'SUPERVISOR';

  const getRoleLabel = (roleStr: string) => {
    const r = (roleStr || '').toUpperCase();
    if (r === 'ADMINISTRATOR' || r === 'ADMIN') return 'Администратор';
    if (r === 'SUPERVISOR') return 'Супервайзер';
    if (r === 'OPERATOR') return 'Оператор';
    if (r === 'AUDITOR') return 'Аудитор';
    return 'Пользователь';
  };

  // Queries for live metrics
  const { data: cashiers = [] } = useQuery({
    queryKey: ['cashiers'],
    queryFn: () => topologyApi.listCashiers(),
    refetchInterval: 10000,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => topologyApi.listBranches(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    enabled: isAdminOrSupervisor,
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => apiRequest('/audit-logs?limit=4').catch(() => []),
    refetchInterval: 15000,
  });

  const onlineCount = cashiers.filter(c => c.last_sync_status === 'SUCCESS' || c.last_sync_status === 'ONLINE').length;
  const offlineCashiers = cashiers.filter(c => c.last_sync_status === 'OFFLINE' || c.last_sync_status === 'UNKNOWN');
  const offlineCount = offlineCashiers.length;

  const [notificationsCleared, setNotificationsCleared] = useState<boolean>(() => {
    return localStorage.getItem('gs_notifications_cleared') === 'true';
  });
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return localStorage.getItem('gs_notifications_cleared') === 'true' ? 0 : 2;
  });

  useEffect(() => {
    if (!notificationsCleared) {
      setUnreadCount(offlineCount + Math.min(recentLogs.length, 2));
    }
  }, [offlineCount, recentLogs, notificationsCleared]);

  const handleClearNotifications = () => {
    setNotificationsCleared(true);
    setUnreadCount(0);
    localStorage.setItem('gs_notifications_cleared', 'true');
  };

  const handleRestoreNotifications = () => {
    setNotificationsCleared(false);
    setUnreadCount(offlineCount + Math.min(recentLogs.length, 2));
    localStorage.removeItem('gs_notifications_cleared');
  };

  // Outside click close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('.search-box input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    authApi.logout();
  };

  // Breadcrumbs text
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/' || path === '/devices') {
      return ['Home', 'Dashboards', 'Analytics'];
    }
    if (path === '/restaurants') {
      return ['Home', 'Dashboards', 'Restaurants'];
    }
    if (path === '/media') {
      return ['Home', 'Content', 'Media Assets'];
    }
    if (path === '/playlists') {
      return ['Home', 'Content', 'Playlists'];
    }
    if (path === '/distribution') {
      return ['Home', 'Content', 'Distribution'];
    }
    if (path === '/users') {
      return ['Home', 'Admin', 'User Management'];
    }
    if (path === '/audit') {
      return ['Home', 'Admin', 'Audit Logs'];
    }
    if (path === '/settings') {
      return ['Home', 'Admin', 'Settings'];
    }
    if (path === '/wiki') {
      return ['Home', 'Help Center', 'Knowledge Base'];
    }
    return ['Home', 'Dashboard'];
  };

  const crumbs = getBreadcrumbs();

  return (
    <div className={`shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-shell="admin">
      
      {/* =========================================================================
          GENTELELLA 2026 V4 SIDEBAR (.sidebar)
          ========================================================================= */}
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} aria-label="Primary navigation">
        
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <img src={brand.emblem} className="w-4 h-4 rounded object-contain" alt="" />
          </div>
          <div className="brand-name">
            GuestScreen <small>v4</small>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          
          {/* GENERAL GROUP */}
          <div className="nav-group">
            <div className="nav-label">General</div>

            {/* Dashboards Tree */}
            <div className={`nav-tree ${dashboardsOpen ? 'open has-active' : ''}`}>
              <button 
                type="button" 
                className="nav-link nav-toggle" 
                onClick={() => setDashboardsOpen(!dashboardsOpen)}
                aria-expanded={dashboardsOpen}
              >
                <LayoutDashboard className="icon w-[18px] h-[18px]" />
                <span className="nav-text">Dashboards</span>
                <span className="badge badge-teal">{cashiers.length}</span>
                <ChevronDown className={`nav-chev w-3 h-3 transition-transform ${dashboardsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {dashboardsOpen && (
                <div className="nav-sub">
                  <div className="nav-sub-inner">
                    <NavLink 
                      to="/devices" 
                      className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                    >
                      <span>Operations</span>
                      <span className="badge badge-teal">{cashiers.length}</span>
                    </NavLink>
                    <NavLink 
                      to="/devices" 
                      className="nav-sublink"
                    >
                      <span>Analytics</span>
                    </NavLink>
                    <NavLink 
                      to="/restaurants" 
                      className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                    >
                      <span>Restaurants</span>
                      <span className="badge badge-blue">{branches.length}</span>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* Content & Ads Tree */}
            <div className={`nav-tree ${adsOpen ? 'open' : ''}`}>
              <button 
                type="button" 
                className="nav-link nav-toggle" 
                onClick={() => setAdsOpen(!adsOpen)}
                aria-expanded={adsOpen}
              >
                <Film className="icon w-[18px] h-[18px]" />
                <span className="nav-text">Content & Ads</span>
                <ChevronDown className={`nav-chev w-3 h-3 transition-transform ${adsOpen ? 'rotate-180' : ''}`} />
              </button>

              {adsOpen && (
                <div className="nav-sub">
                  <div className="nav-sub-inner">
                    <NavLink 
                      to="/media" 
                      className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                    >
                      <span>Media Assets</span>
                    </NavLink>
                    <NavLink 
                      to="/playlists" 
                      className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                    >
                      <span>Ad Templates</span>
                    </NavLink>
                    <NavLink 
                      to="/distribution" 
                      className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                    >
                      <span>Distribution</span>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ADMIN GROUP */}
          <div className="nav-group">
            <div className="nav-label">Admin</div>

            {isAdminOrSupervisor && (
              <NavLink 
                to="/users" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <UsersIcon className="icon w-[18px] h-[18px]" />
                <span className="nav-text">User management</span>
                {users.length > 0 && <span className="badge badge-blue">{users.length}</span>}
              </NavLink>
            )}

            <NavLink 
              to="/audit" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <FileText className="icon w-[18px] h-[18px]" />
              <span className="nav-text">Audit logs</span>
            </NavLink>

            {isAdminOrSupervisor && (
              <NavLink 
                to="/settings" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <SettingsIcon className="icon w-[18px] h-[18px]" />
                <span className="nav-text">Settings</span>
              </NavLink>
            )}

            <NavLink 
              to="/wiki" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <BookOpen className="icon w-[18px] h-[18px]" />
              <span className="nav-text">Help center</span>
              <span className="badge badge-teal">Wiki</span>
            </NavLink>

          </div>

        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">
              {user.username.substring(0, 1).toUpperCase()}
              <span className="online"></span>
            </div>
            <div className="sidebar-user-info">
              <div className="name">{user.full_name || user.username}</div>
              <div className="role">{getRoleLabel(user.role)} • {brand.port}</div>
            </div>
            <button 
              className="more-btn" 
              onClick={() => setUserMenuOpen(!userMenuOpen)} 
              aria-label="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </aside>

      {/* =========================================================================
          GENTELELLA 2026 V4 TOPBAR (.topbar)
          ========================================================================= */}
      <header className="topbar">
        
        {/* Topbar Left: Toggle + Breadcrumbs */}
        <div className="topbar-left">
          <button 
            className="sidebar-toggle" 
            type="button" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="breadcrumb" aria-label="Breadcrumb">
            {crumbs.map((crumb, idx) => {
              const isLast = idx === crumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="sep" aria-hidden="true">›</span>}
                  {isLast ? (
                    <span className="current" aria-current="page">{crumb}</span>
                  ) : (
                    <span>{crumb}</span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Topbar Center: Universal Search */}
        <div className="search-box">
          <Search className="s-icon w-3.5 h-3.5" />
          <input 
            type="text" 
            placeholder="Search pages or run a command…" 
            aria-label="Search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && globalSearch) {
                navigate(`/devices?search=${encodeURIComponent(globalSearch)}`);
              }
            }}
          />
          <kbd>⌘K</kbd>
        </div>

        {/* Topbar Right: Actions, Tenant, Theme, Notifications, Avatar */}
        <div className="topbar-right">
          
          {/* Docs Button */}
          <a 
            className="tb-btn tb-docs" 
            href="/wiki" 
            title="Documentation"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Docs</span>
          </a>

          {/* Tenant Pill */}
          <div className="tb-tenant-pill hidden sm:inline-flex">
            <img src={brand.emblem} alt="" className="w-3.5 h-3.5 rounded object-contain" />
            <span>{brand.name} • {brand.port}</span>
          </div>

          {/* Theme Toggle */}
          <button 
            className="tb-btn theme-toggle" 
            type="button" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button 
              className="tb-btn tb-notifications" 
              type="button" 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && <span className="dot"></span>}
            </button>

            {notificationsOpen && (
              <div 
                style={{ position: 'absolute' }}
                className="right-0 top-full mt-2 w-80 bg-white border border-[#E6E7EB] rounded-lg shadow-xl z-50 overflow-hidden text-xs"
              >
                <div className="p-3 bg-[#F9FAFB] border-b border-[#E6E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#1E2633]">
                    <Bell className="w-3.5 h-3.5 text-[#1ABB9C]" />
                    <span>Уведомления системы</span>
                  </div>
                  {unreadCount > 0 ? (
                    <button 
                      onClick={handleClearNotifications}
                      className="text-[11px] text-[#1ABB9C] hover:underline font-semibold"
                    >
                      Очистить все
                    </button>
                  ) : (
                    <button 
                      onClick={handleRestoreNotifications}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Восстановить
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#EFF0F3]">
                  {offlineCashiers.length > 0 && (
                    <div className="p-3 bg-rose-50/50 hover:bg-rose-50 transition">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-rose-800">
                            {offlineCashiers.length} {offlineCashiers.length === 1 ? 'касса не в сети' : 'касс не в сети'}
                          </p>
                          <p className="text-[11px] text-rose-600 mt-0.5">
                            Проверьте сетевой коннект POS-моноблоков GuestScreen
                          </p>
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate('/devices?status=OFFLINE');
                            }}
                            className="mt-1.5 text-[11px] font-bold text-rose-700 hover:underline"
                          >
                            Показать офлайн кассы →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {recentLogs.slice(0, 3).map((log: any) => (
                    <div key={log.id} className="p-2.5 hover:bg-[#F9FAFB] transition">
                      <div className="flex items-center justify-between text-[11px] text-[#7E8896]">
                        <span className="font-medium text-[#1E2633]">{log.action}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-[11px] text-[#626D7D] truncate mt-0.5">{log.details || log.entity_type}</p>
                    </div>
                  ))}
                </div>

                <div className="p-2 bg-[#F9FAFB] border-t border-[#E6E7EB] text-center">
                  <button 
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/audit');
                    }}
                    className="text-[11px] font-bold text-[#1ABB9C] hover:underline"
                  >
                    Открыть весь журнал аудита
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button 
              className="tb-avatar" 
              type="button" 
              onClick={() => setUserMenuOpen(!userMenuOpen)} 
              aria-label="Account menu"
            >
              {user.username.substring(0, 1).toUpperCase()}
            </button>

            {userMenuOpen && (
              <div 
                style={{ position: 'absolute' }}
                className="right-0 top-full mt-2 w-56 bg-white border border-[#E6E7EB] rounded-lg shadow-xl z-50 py-1 text-xs"
              >
                <div className="px-4 py-2 border-b border-[#E6E7EB]">
                  <p className="font-bold text-[#1E2633] truncate">{user.full_name || user.username}</p>
                  <p className="text-[11px] font-mono text-[#7E8896] truncate">@{user.username}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-[#1ABB9C]">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                {isAdminOrSupervisor && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/users');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[#1E2633] hover:bg-[#F5F7FB] text-left transition"
                  >
                    <UsersIcon className="w-4 h-4 text-[#7E8896]" />
                    <span>Пользователи</span>
                  </button>
                )}
                {isAdminOrSupervisor && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[#1E2633] hover:bg-[#F5F7FB] text-left transition"
                  >
                    <SettingsIcon className="w-4 h-4 text-[#7E8896]" />
                    <span>Параметры</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/audit');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[#1E2633] hover:bg-[#F5F7FB] text-left transition"
                >
                  <FileText className="w-4 h-4 text-[#7E8896]" />
                  <span>Журнал аудита</span>
                </button>
                <div className="border-t border-[#E6E7EB] my-1" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 font-bold text-[#D63939] hover:bg-[#FDF2F2] text-left transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Выйти (Sign out)</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* =========================================================================
          GENTELELLA 2026 V4 MAIN CONTENT (.main)
          ========================================================================= */}
      <main className="main" id="main-content">
        <div className="page-wrapper">
          <Outlet />

          {/* Footer */}
          <footer className="footer">
            <span>Gentelella — free admin dashboard template by <a href="https://colorlib.com" target="_blank" rel="noopener">Colorlib</a></span>
            <span>v4.1.1 · MIT · GuestScreen Control Center ({brand.name})</span>
          </footer>
        </div>
      </main>

    </div>
  );
};
