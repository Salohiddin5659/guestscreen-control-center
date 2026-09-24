import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Monitor, 
  Building2,
  Image as ImageIcon, 
  Film, 
  Layers, 
  FileText, 
  LogOut, 
  Radio, 
  Users as UsersIcon,
  Settings as SettingsIcon,
  Search,
  Bell,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Menu,
  Maximize2,
  BookOpen,
  HelpCircle,
  Activity,
  Server
} from 'lucide-react';
import { removeAuthToken, topologyApi, usersApi, getCurrentUserFromStorage, apiRequest, authApi } from '../../api/client';
import { useLiveFleet } from '../../api/useLiveFleet';
import { getBrand } from '../../utils/brand';

export const AppLayout: React.FC = () => {
  const brand = getBrand();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useLiveFleet();

  // Sidebar toggle state (Gentelella nav-md vs nav-sm)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('gs_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('gs_sidebar_collapsed', String(next));
      return next;
    });
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

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsCleared, setNotificationsCleared] = useState<boolean>(() => {
    return localStorage.getItem('gs_notifications_cleared') === 'true';
  });
  const [unreadCount, setUnreadCount] = useState<number | null>(() => {
    return localStorage.getItem('gs_notifications_cleared') === 'true' ? 0 : null;
  });
  
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch cashiers for top header status counters
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

  // Fetch recent audit logs for notification feed
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['recent-audit-logs'],
    queryFn: () => apiRequest('/audit-logs?limit=4').catch(() => []),
    refetchInterval: 15000,
  });

  const onlineCount = cashiers.filter(c => c.last_sync_status === 'SUCCESS' || c.last_sync_status === 'ONLINE').length;
  const offlineCashiers = cashiers.filter(c => c.last_sync_status === 'OFFLINE' || c.last_sync_status === 'UNKNOWN');
  const offlineCount = offlineCashiers.length;
  const syncRate = cashiers.length > 0 ? Math.round((onlineCount / cashiers.length) * 100) : 100;

  // Initialize unread count if not cleared
  useEffect(() => {
    if (!notificationsCleared && unreadCount === null && (offlineCount > 0 || recentLogs.length > 0)) {
      setUnreadCount(offlineCount + Math.min(recentLogs.length, 2));
    }
  }, [offlineCount, recentLogs, unreadCount, notificationsCleared]);

  const handleClearAllNotifications = () => {
    setNotificationsCleared(true);
    setUnreadCount(0);
    localStorage.setItem('gs_notifications_cleared', 'true');
  };

  const handleRestoreNotifications = () => {
    setNotificationsCleared(false);
    setUnreadCount(offlineCount + Math.min(recentLogs.length, 2));
    localStorage.removeItem('gs_notifications_cleared');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    authApi.logout();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    badge?: number;
  }
  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: 'УПРАВЛЕНИЕ КАССАМИ',
      items: [
        { to: '/devices', label: 'Устройства', icon: Monitor, badge: cashiers.length },
        { to: '/restaurants', label: 'Рестораны', icon: Building2, badge: branches.length },
      ]
    },
    {
      title: 'РЕКЛАМА И КОНТЕНТ',
      items: [
        { to: '/media', label: 'Медиатека', icon: ImageIcon },
        { to: '/playlists', label: 'Рекламные шаблоны', icon: Film },
        { to: '/content', label: 'Распределение', icon: Layers },
      ]
    },
    {
      title: 'БЕЗОПАСНОСТЬ И СИСТЕМА',
      items: [
        ...(isAdminOrSupervisor ? [{ to: '/users', label: 'Пользователи', icon: UsersIcon, badge: users.length }] : []),
        { to: '/audit', label: 'Журнал аудита', icon: FileText },
        ...(isAdminOrSupervisor ? [{ to: '/settings', label: 'Настройки', icon: SettingsIcon }] : []),
        { to: '/wiki', label: 'База знаний', icon: BookOpen },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#F7F7F7] text-[#2A3F54] font-sans overflow-hidden">
      
      {/* =========================================================================
          GENTELELLA SIDEBAR (.left_col)
          ========================================================================= */}
      <aside 
        className={`bg-[#2A3F54] flex flex-col z-30 transition-all duration-300 ease-in-out select-none relative ${
          isCollapsed ? 'w-[70px]' : 'w-[240px]'
        }`}
      >
        {/* Brand Header (.site_title) */}
        <div className="h-[60px] bg-[#2A3F54] border-b border-[#374c60] flex items-center px-4 overflow-hidden">
          <NavLink 
            to="/" 
            className="flex items-center gap-3 w-full text-white text-decoration-none group"
            title="GuestScreen Control Center - На главную"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 p-1.5 flex items-center justify-center flex-shrink-0 border border-white/20 shadow-sm group-hover:scale-105 transition-transform">
              <img src={brand.emblem} alt={brand.name} className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[15px] tracking-tight text-white truncate">
                    GuestScreen
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#1ABB9C] inline-block" />
                </div>
                <span className="text-[10px] text-[#A7B5C2] uppercase tracking-wider font-semibold truncate">
                  {brand.name}
                </span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Profile Quick Info (.profile.clearfix) */}
        {!isCollapsed && (
          <div className="p-4 border-b border-[#374c60] flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#3E5367] border-2 border-white/20 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#1ABB9C] border-2 border-[#2A3F54]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-[#A7B5C2] font-medium leading-none">Welcome,</span>
              <h2 className="text-sm font-bold text-white mt-1 leading-tight truncate">
                {user.full_name || user.username}
              </h2>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1ABB9C]/20 text-[#1ABB9C] border border-[#1ABB9C]/30 w-fit">
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        )}

        {/* Sidebar Menu (.sidebar-menu) */}
        <div className="flex-1 overflow-y-auto sidebar-scrollbar py-2">
          {navSections.map((section, idx) => (
            <div key={idx} className="mb-3">
              {!isCollapsed && (
                <div className="px-4 py-1.5 text-[10px] font-bold text-[#A7B5C2] uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                      flex items-center px-4 py-2.5 text-xs font-semibold transition-all relative group
                      ${isActive 
                        ? 'bg-[#3E5367] text-white border-r-4 border-[#1ABB9C]' 
                        : 'text-[#C5CCD4] hover:bg-[#334a5e] hover:text-white'
                      }
                      ${isCollapsed ? 'justify-center px-0' : 'gap-3'}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isCollapsed ? 'w-5 h-5' : ''}`} />
                    {!isCollapsed && (
                      <span className="truncate flex-1">
                        {item.label}
                      </span>
                    )}
                    {!isCollapsed && item.badge !== undefined && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#1ABB9C] text-white">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer (.sidebar-footer) */}
        <div className="h-[44px] bg-[#1E2833] border-t border-[#374c60] flex items-center justify-around px-2 text-[#A7B5C2]">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:text-[#1ABB9C] hover:bg-[#2A3F54] rounded transition"
            title="Настройки системы"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={toggleFullScreen}
            className="p-2 hover:text-[#1ABB9C] hover:bg-[#2A3F54] rounded transition"
            title="Полноэкранный режим"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate('/wiki')}
            className="p-2 hover:text-[#1ABB9C] hover:bg-[#2A3F54] rounded transition"
            title="База знаний и инструкция"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 hover:text-[#E74C3C] hover:bg-[#2A3F54] rounded transition"
            title="Выход из системы"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTAINER (TOP NAV + CONTENT)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navigation Bar (.top_nav) */}
        <header className="h-[60px] bg-[#EDEDED] border-b border-[#D9DEE4] flex items-center justify-between px-4 z-20 shadow-sm">
          
          {/* Left: Hamburger Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 text-[#73879C] hover:text-[#2A3F54] hover:bg-[#D9DEE4] rounded transition cursor-pointer"
              title="Переключить меню"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Server Brand Live Pill */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white border border-[#D9DEE4] rounded text-xs font-semibold text-[#2A3F54] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#1ABB9C] animate-pulse" />
              <span>{brand.name}</span>
              <span className="text-[#999999]">•</span>
              <span className="text-[11px] font-mono text-[#73879C]">{brand.port}</span>
            </div>
          </div>

          {/* Right: Fleet Stats Badges, Notifications, User Menu */}
          <div className="flex items-center gap-3">
            
            {/* Quick Stats Badges */}
            <div className="hidden lg:flex items-center gap-2 mr-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-white border border-[#D9DEE4] text-[#73879C]">
                Всего: <strong className="text-[#2A3F54]">{cashiers.length}</strong>
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#1ABB9C]/10 border border-[#1ABB9C]/30 text-[#1ABB9C]">
                В сети: <strong>{onlineCount}</strong>
              </span>
              {offlineCount > 0 && (
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#E74C3C]/10 border border-[#E74C3C]/30 text-[#E74C3C]">
                  Офлайн: <strong>{offlineCount}</strong>
                </span>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-[#73879C] hover:text-[#2A3F54] hover:bg-[#D9DEE4] rounded transition cursor-pointer"
                title="Уведомления и инциденты"
              >
                <Bell className="w-5 h-5" />
                {(unreadCount ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#E74C3C] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div 
                  style={{ position: 'absolute' }}
                  className="right-0 top-full mt-2 w-80 bg-white border border-[#E6E9ED] rounded shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-3 bg-[#F7F7F7] border-b border-[#E6E9ED] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2A3F54] uppercase tracking-wider">
                      Уведомления флота
                    </span>
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-[11px] text-[#1ABB9C] hover:underline cursor-pointer font-medium"
                    >
                      Прочитать все
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E6E9ED]">
                    {offlineCashiers.length > 0 ? (
                      offlineCashiers.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            setNotificationsOpen(false);
                            navigate(`/devices?search=${encodeURIComponent(c.ip_address)}`);
                          }}
                          className="p-3 hover:bg-[#F9FAFB] cursor-pointer transition flex items-start gap-2.5"
                        >
                          <AlertTriangle className="w-4 h-4 text-[#E74C3C] flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#2A3F54] truncate">{c.name}</p>
                            <p className="text-[11px] font-mono text-[#73879C]">{c.ip_address}</p>
                            <span className="text-[10px] font-semibold text-[#E74C3C]">Не выходит на связь</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-[#73879C]">
                        <CheckCircle2 className="w-6 h-6 text-[#1ABB9C] mx-auto mb-2" />
                        Все кассы подключены и работают стабильно.
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[#F7F7F7] border-t border-[#E6E9ED] text-center">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/devices');
                      }}
                      className="text-xs text-[#1ABB9C] font-semibold hover:underline"
                    >
                      Открыть все кассы ({cashiers.length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded hover:bg-[#D9DEE4] transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#2A3F54] text-white font-bold text-xs flex items-center justify-center">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <span className="hidden md:inline text-xs font-bold text-[#2A3F54]">
                  {user.username}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#73879C]" />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div 
                  style={{ position: 'absolute' }}
                  className="right-0 top-full mt-2 w-56 bg-white border border-[#E6E9ED] rounded shadow-xl z-50 py-1"
                >
                  <div className="px-4 py-2 border-b border-[#E6E9ED]">
                    <p className="text-xs font-bold text-[#2A3F54] truncate">{user.full_name || user.username}</p>
                    <p className="text-[11px] font-mono text-[#73879C] truncate">@{user.username}</p>
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
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A3F54] hover:bg-[#F7F7F7] text-left transition"
                    >
                      <UsersIcon className="w-4 h-4 text-[#73879C]" />
                      <span>Пользователи системы</span>
                    </button>
                  )}
                  {isAdminOrSupervisor && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A3F54] hover:bg-[#F7F7F7] text-left transition"
                    >
                      <SettingsIcon className="w-4 h-4 text-[#73879C]" />
                      <span>Параметры сервера</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/audit');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#2A3F54] hover:bg-[#F7F7F7] text-left transition"
                  >
                    <FileText className="w-4 h-4 text-[#73879C]" />
                    <span>Журнал аудита</span>
                  </button>
                  <div className="border-t border-[#E6E9ED] my-1" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-[#E74C3C] hover:bg-[#FDF2F2] text-left transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти (Logout)</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* =========================================================================
            CONTENT WRAPPER (.right_col)
            ========================================================================= */}
        <main className="right_col flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7F7F7]">
          
          {/* Gentelella Top Metric Tiles (.tile_count) */}
          <div className="tile_count mb-5">
            
            <div className="tile_stats_count">
              <span className="count_top">
                <Monitor className="w-3.5 h-3.5 text-[#3498DB]" /> Всего касс
              </span>
              <div className="count">{cashiers.length}</div>
              <span className="count_bottom">
                <span className="green">● {onlineCount}</span> активных
              </span>
            </div>

            <div className="tile_stats_count">
              <span className="count_top">
                <Activity className="w-3.5 h-3.5 text-[#1ABB9C]" /> В сети (Онлайн)
              </span>
              <div className="count green">{onlineCount}</div>
              <span className="count_bottom">
                <span className="green font-bold">{syncRate}%</span> флота
              </span>
            </div>

            <div className="tile_stats_count">
              <span className="count_top">
                <AlertTriangle className="w-3.5 h-3.5 text-[#E74C3C]" /> Ошибки / Офлайн
              </span>
              <div className={`count ${offlineCount > 0 ? 'red' : 'text-[#73879C]'}`}>
                {offlineCount}
              </div>
              <span className="count_bottom">
                {offlineCount > 0 ? (
                  <span className="red font-semibold">Требует внимания</span>
                ) : (
                  <span className="green">Все в норме</span>
                )}
              </span>
            </div>

            <div className="tile_stats_count">
              <span className="count_top">
                <Building2 className="w-3.5 h-3.5 text-[#9B59B6]" /> Рестораны
              </span>
              <div className="count blue">{branches.length}</div>
              <span className="count_bottom">
                <span className="blue">{brand.name}</span> сеть
              </span>
            </div>

            <div className="tile_stats_count">
              <span className="count_top">
                <Server className="w-3.5 h-3.5 text-[#F39C12]" /> Серверное ядро
              </span>
              <div className="count text-sm font-bold text-[#2A3F54] flex items-center gap-1.5 h-8">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1ABB9C] animate-pulse" />
                <span>Port {brand.port}</span>
              </div>
              <span className="count_bottom">
                <span className="green font-medium">FastAPI & PostgreSQL</span>
              </span>
            </div>

          </div>

          {/* Child Page Content */}
          <Outlet />

          {/* Gentelella Footer */}
          <footer className="mt-8 pt-4 border-t border-[#E6E9ED] text-center text-xs text-[#73879C]">
            <p>
              <strong>GuestScreen Control Center</strong> · Colorlib Gentelella UI Architecture · {brand.name} © 2026
            </p>
          </footer>
        </main>

      </div>

    </div>
  );
};
