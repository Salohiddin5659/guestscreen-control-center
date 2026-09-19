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
  RotateCcw
} from 'lucide-react';
import { removeAuthToken, topologyApi, usersApi, getCurrentUserFromStorage, apiRequest, authApi } from '../../api/client';
import { useLiveFleet } from '../../api/useLiveFleet';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useLiveFleet();

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

  // Dynamic context for the top header breadcrumb
  const getPageContext = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/devices')) {
      return {
        title: 'Управление кассами',
        category: 'Оборудование',
        subtitle: 'Централизованный мониторинг кассового флота',
        icon: Monitor,
      };
    }
    if (path.startsWith('/restaurants')) {
      return {
        title: 'Рестораны и филиалы',
        category: 'Топология',
        subtitle: 'Управление сетью заведений Oqtepa Lavash',
        icon: Building2,
      };
    }
    if (path.startsWith('/media')) {
      return {
        title: 'Медиатека контента',
        category: 'Реклама',
        subtitle: 'Баннеры, видео и промо-материалы',
        icon: ImageIcon,
      };
    }
    if (path.startsWith('/playlists')) {
      return {
        title: 'Рекламные шаблоны',
        category: 'Плейлисты',
        subtitle: 'Конфигурация полноэкранной рекламы и 50/50',
        icon: Film,
      };
    }
    if (path.startsWith('/content')) {
      return {
        title: 'Распределение контента',
        category: 'Вещание',
        subtitle: 'Публикация рекламных кампаний на кассы',
        icon: Layers,
      };
    }
    if (path.startsWith('/users')) {
      return {
        title: 'Пользователи и доступ',
        category: 'Безопасность',
        subtitle: 'Управление учетными записями и правами (RBAC)',
        icon: UsersIcon,
      };
    }
    if (path.startsWith('/audit')) {
      return {
        title: 'Журнал аудита',
        category: 'Система',
        subtitle: 'История действий операторов и инцидентов',
        icon: FileText,
      };
    }
    if (path.startsWith('/settings')) {
      return {
        title: 'Параметры системы',
        category: 'Конфигурация',
        subtitle: 'Глобальные настройки сервера GuestScreen',
        icon: SettingsIcon,
      };
    }
    return {
      title: 'Панель управления',
      category: 'GuestScreen',
      subtitle: 'Управление экранами касс Oqtepa Lavash',
      icon: Monitor,
    };
  };

  const pageCtx = getPageContext();
  const PageContextIcon = pageCtx.icon;

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

  // Initialize unread count if not cleared
  useEffect(() => {
    if (!notificationsCleared && unreadCount === null && (offlineCount > 0 || recentLogs.length > 0)) {
      setUnreadCount(offlineCount + Math.min(recentLogs.length, 2));
    }
  }, [offlineCount, recentLogs, unreadCount, notificationsCleared]);

  // Handle "Прочитать все" - marks notifications as read without destroying the cashier list
  const handleClearAllNotifications = () => {
    setNotificationsCleared(true);
    setUnreadCount(0);
    localStorage.setItem('gs_notifications_cleared', 'true');
  };

  // Allow user to restore notifications unread counter
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
        ...(isAdminOrSupervisor ? [{ to: '/users', label: 'Пользователи и доступ', icon: UsersIcon, badge: users.length }] : []),
        { to: '/audit', label: 'Журнал аудита', icon: FileText },
        ...(isAdminOrSupervisor ? [{ to: '/settings', label: 'Настройки', icon: SettingsIcon }] : []),
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-transparent text-slate-100 font-sans antialiased overflow-hidden selection:bg-[#A9DFD8] selection:text-[#070b12]">
      
      {/* 1. Sidebar - Spatial Liquid Glass Navigation */}
      <aside className="w-64 glass-surface-l3 border-r border-glass-elevated flex flex-col justify-between flex-shrink-0 z-20 glass-specular-edge">
        
        <div className="flex flex-col h-full">
          {/* Brand Header with Official Oqtepa Lavash Emblem */}
          <div className="px-5 py-4 flex items-center space-x-3 border-b border-glass-subtle">
            <img 
              src="/oqtepa_emblem.svg" 
              alt="Oqtepa Lavash" 
              className="w-10 h-10 rounded-xl shadow-lg shadow-[#C81E28]/25 flex-shrink-0 object-contain ring-1 ring-white/10" 
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-sm tracking-tight text-white uppercase truncate">Oqtepa Lavash</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-glass-cyan text-[#A9DFD8] font-mono border border-[#A9DFD8]/30">
                  v3.1
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block truncate">GuestScreen • Кассы</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-5 overflow-y-auto flex-1">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {section.title}
                </h3>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to === '/devices' && location.pathname === '/');
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'glass-active-capsule'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-glass-subtle'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#A9DFD8]' : 'text-slate-400 group-hover:text-white'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'glass-surface-l1 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-transparent">
        
        {/* Top Header Bar - Floating Spatial Island */}
        <header className="h-16 glass-surface-l3 border-b border-glass-elevated px-6 flex items-center justify-between flex-shrink-0 z-40 glass-specular-edge">
          
          {/* Left: Dynamic Page Breadcrumb Context */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A9DFD8]/20 to-[#A9DFD8]/5 border border-[#A9DFD8]/30 flex items-center justify-center text-[#A9DFD8] shadow-sm flex-shrink-0">
              <PageContextIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-extrabold text-white tracking-tight uppercase truncate">{pageCtx.title}</h2>
                <span className="text-slate-600 text-[10px] hidden sm:inline">•</span>
                <span className="text-[10px] font-mono text-[#A9DFD8] font-bold px-1.5 py-0.5 bg-[#A9DFD8]/10 rounded border border-[#A9DFD8]/20 hidden sm:inline">
                  {pageCtx.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate hidden md:block">
                {pageCtx.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Fleet Health, Live Pulse, Notifications & User Dropdown */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2">
              <div 
                onClick={() => navigate('/devices?status=ONLINE')}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-full glass-surface-l1 border border-[#05C168]/40 text-[#05C168] font-mono text-[11px] font-bold cursor-pointer hover:border-[#05C168] hover:bg-[#05C168]/15 transition shadow-sm liquid-interactive"
                title="Фильтр: только кассы в сети"
              >
                <span className="w-2 h-2 rounded-full bg-[#05C168] animate-pulse shadow-[0_0_8px_#05C168]" />
                <span>В сети: {onlineCount}</span>
              </div>

              <div 
                onClick={() => navigate('/devices?status=OFFLINE')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full glass-surface-l1 border font-mono text-[11px] font-bold cursor-pointer transition shadow-sm liquid-interactive ${
                  offlineCount > 0 
                    ? 'border-[#FF5B5B]/50 text-[#FF5B5B] hover:bg-[#FF5B5B]/15 hover:border-[#FF5B5B]' 
                    : 'border-glass-subtle text-slate-400'
                }`}
                title="Фильтр: только кассы оффлайн"
              >
                <span className={`w-2 h-2 rounded-full ${offlineCount > 0 ? 'bg-[#FF5B5B] shadow-[0_0_8px_#FF5B5B]' : 'bg-slate-500'}`} />
                <span>Оффлайн: {offlineCount}</span>
              </div>
            </div>

            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

            {isConnected ? (
              <span className="flex items-center space-x-1.5 text-[11px] font-mono text-[#05C168] glass-surface-l1 px-3 py-1 rounded-full border border-[#05C168]/40 font-semibold shadow-sm">
                <Radio className="w-3 h-3 text-[#05C168] animate-pulse" />
                <span>Real-time Sync</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400 glass-surface-l1 px-3 py-1 rounded-full border border-glass-subtle">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>Авто-опрос 10с</span>
              </span>
            )}

            {/* Notification Bell with interactive dropdown */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  if (userMenuOpen) setUserMenuOpen(false);
                }}
                className={`p-2 rounded-xl border text-slate-300 hover:text-white transition-all relative liquid-interactive ${
                  notificationsOpen 
                    ? 'glass-active-capsule text-[#A9DFD8]' 
                    : 'glass-surface-l1 hover:bg-white/15 border-glass-subtle'
                }`}
                title="Уведомления системы"
              >
                <Bell className={`w-4 h-4 ${notificationsOpen ? 'text-[#A9DFD8]' : ''}`} />
                {!notificationsCleared && unreadCount !== null && unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF5B5B] ring-2 ring-[#070b12] animate-pulse shadow-[0_0_6px_#FF5B5B]" />
                )}
              </button>

              {/* Notification Center Popover */}
              {notificationsOpen && (
                <div 
                  style={{ position: 'absolute' }}
                  className="right-0 top-full mt-3 w-80 sm:w-96 glass-surface-l3 border border-glass-elevated rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col glass-specular-edge liquid-chromatic-edge"
                >
                  
                  {/* Dropdown Header */}
                  <div className="p-4 border-b border-glass-subtle flex items-center justify-between bg-white/[0.03] flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-[#A9DFD8]" />
                      <span className="text-xs font-bold text-white">Центр уведомлений</span>
                      {unreadCount !== null && unreadCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FF5B5B]/15 text-[#FF5B5B] border border-[#FF5B5B]/30">
                          {unreadCount} новых
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#05C168]/15 text-[#05C168] border border-[#05C168]/30">
                          Все прочитано
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notificationsCleared && unreadCount !== null && unreadCount > 0 ? (
                        <button
                          onClick={handleClearAllNotifications}
                          className="text-[10px] font-bold text-[#A9DFD8] hover:underline transition"
                          title="Пометить все как прочитанные"
                        >
                          Прочитать все
                        </button>
                      ) : (
                        <button
                          onClick={handleRestoreNotifications}
                          className="text-[10px] text-slate-400 hover:text-[#A9DFD8] flex items-center gap-1 transition"
                          title="Показать скрытые уведомления"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Показать</span>
                        </button>
                      )}
                      <button 
                        onClick={() => setNotificationsOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Notification List */}
                  <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                    
                    {notificationsCleared ? (
                      <div className="py-8 px-4 text-center flex flex-col items-center justify-center space-y-2.5">
                        <div className="w-10 h-10 rounded-full bg-[#05C168]/15 text-[#05C168] flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white">Все уведомления прочитаны</span>
                        <p className="text-[11px] text-slate-400 max-w-[240px]">
                          Список очищен. Активных непрочитанных оповещений нет.
                        </p>
                        <button
                          onClick={handleRestoreNotifications}
                          className="mt-1 px-3 py-1 rounded-lg text-[11px] font-semibold text-[#A9DFD8] bg-[#A9DFD8]/10 hover:bg-[#A9DFD8]/20 border border-[#A9DFD8]/20 transition flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Показать список касс ({offlineCount})</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Offline Cashiers Section */}
                        {offlineCashiers.length > 0 ? (
                          <>
                            <div className="px-2 pt-1 pb-0.5 flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              <span>Кассы без связи ({offlineCount})</span>
                              <span className="text-rose-400">Внимание</span>
                            </div>
                            {offlineCashiers.slice(0, 5).map((c) => {
                              const branch = branches.find(b => b.id === c.branch_id);
                              return (
                                <div 
                                  key={c.id} 
                                  onClick={() => {
                                    setNotificationsOpen(false);
                                    navigate(`/devices?search=${encodeURIComponent(c.ip_address)}`);
                                  }}
                                  className="p-3 rounded-xl bg-[#FF5B5B]/10 border border-[#FF5B5B]/25 flex items-start space-x-3 hover:bg-[#FF5B5B]/20 transition cursor-pointer group"
                                  title="Нажмите, чтобы найти кассу в списке устройств"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-[#FF5B5B]/20 flex items-center justify-center flex-shrink-0 text-[#FF5B5B] mt-0.5 group-hover:scale-105 transition-transform">
                                    <AlertTriangle className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-white truncate">{c.name}</span>
                                      <span className="text-[10px] font-mono text-[#FF5B5B] font-bold">ОФФЛАЙН</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug truncate">
                                      <span className="font-mono text-[#A9DFD8]">{c.ip_address}</span>
                                      {branch ? ` • ${branch.name}` : ''}
                                    </p>
                                    <span className="text-[10px] text-[#A9DFD8] group-hover:underline font-semibold mt-1 inline-flex items-center gap-1">
                                      Найти в устройствах →
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            {offlineCashiers.length > 5 && (
                              <button
                                onClick={() => {
                                  setNotificationsOpen(false);
                                  navigate('/devices?status=OFFLINE');
                                }}
                                className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-[#FF5B5B] bg-[#FF5B5B]/10 hover:bg-[#FF5B5B]/20 border border-[#FF5B5B]/25 transition text-center block"
                              >
                                Показать все {offlineCount} офлайн-касс →
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="py-6 px-4 text-center flex flex-col items-center justify-center space-y-2">
                            <div className="w-9 h-9 rounded-full bg-[#05C168]/15 text-[#05C168] flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-white">Все кассы в сети</span>
                            <p className="text-[11px] text-slate-400 max-w-[240px]">
                              Все устройства отвечают по сети. Сбоев не обнаружено.
                            </p>
                          </div>
                        )}

                        {/* Fleet Sync Status Card */}
                        <div className="p-3 rounded-xl glass-surface-l1 border border-glass-subtle flex items-start space-x-3">
                          <div className="w-7 h-7 rounded-lg bg-[#A9DFD8]/10 flex items-center justify-center flex-shrink-0 text-[#A9DFD8] mt-0.5">
                            <Radio className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">Служба синхронизации</span>
                              <span className="text-[10px] font-mono text-[#05C168] font-bold">АКТИВНА</span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                              В сети {onlineCount} из {cashiers.length} устройств ({cashiers.length > 0 ? Math.round((onlineCount/cashiers.length)*100) : 100}%).
                            </p>
                          </div>
                        </div>

                        {/* Recent Audit Events */}
                        {recentLogs.slice(0, 3).map((log: any) => (
                          <div 
                            key={log.id} 
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate('/audit');
                            }}
                            className="p-3 rounded-xl glass-surface-l1 border border-glass-subtle flex items-start space-x-3 hover:bg-white/5 transition cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#FFB648]/10 flex items-center justify-center flex-shrink-0 text-[#FFB648] mt-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white truncate">{log.action}</span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {new Date(log.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                                {log.entity_type} {log.entity_id ? `• ${log.entity_id}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-3 border-t border-glass-subtle bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/audit');
                      }}
                      className="text-xs text-[#A9DFD8] hover:text-white font-semibold flex items-center gap-1.5 transition"
                    >
                      <span>Журнал аудита</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigate('/devices');
                      }}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      Все кассы ({cashiers.length})
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Interactive User Profile & Logout Dropdown with Oqtepa Brand badge */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  if (notificationsOpen) setNotificationsOpen(false);
                }}
                className={`flex items-center space-x-2.5 p-1.5 pl-2.5 pr-2 rounded-xl border transition-all ${
                  userMenuOpen 
                    ? 'glass-surface-l2 border-[#A9DFD8]/40 shadow-lg' 
                    : 'glass-surface-l1 hover:bg-white/10 border-glass-subtle'
                }`}
                title="Профиль пользователя и выход"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#A9DFD8] to-emerald-400 text-[#070b12] font-black text-xs flex items-center justify-center shadow-md">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">{user.username}</span>
                  <span className="text-[10px] text-slate-400 font-mono leading-tight">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-[#A9DFD8]' : ''}`} />
              </button>

              {/* User Dropdown Popover */}
              {userMenuOpen && (
                <div 
                  style={{ position: 'absolute' }}
                  className="right-0 top-full mt-3 w-72 glass-surface-l3 border border-glass-elevated rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col glass-specular-edge"
                >
                  
                  {/* User Profile Card Header */}
                  <div className="p-4 bg-white/[0.03] border-b border-glass-subtle">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#A9DFD8] to-emerald-400 text-[#070b12] font-black text-sm flex items-center justify-center shadow-lg shadow-[#A9DFD8]/15">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {user.full_name || user.username}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400 block truncate">
                          @{user.username}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#05C168] animate-pulse" />
                          <span className="text-[10px] font-semibold text-[#05C168]">Авторизован</span>
                          <span className="text-slate-500 text-[10px]">•</span>
                          <span className="text-[10px] font-mono text-[#FFB648] font-bold">
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-glass-subtle flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1 text-white/90">
                        <img src="/oqtepa_emblem.svg" className="w-3.5 h-3.5 rounded object-contain" alt="" />
                        Oqtepa Lavash
                      </span>
                      <span>ID: {user.id ? `${user.id.substring(0, 6)}...` : 'admin'}</span>
                    </div>
                  </div>

                  {/* Navigation Links inside profile */}
                  <div className="p-2 space-y-1 text-xs">
                    {isAdminOrSupervisor && (
                      <>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate('/users');
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition text-left"
                        >
                          <UsersIcon className="w-4 h-4 text-[#A9DFD8]" />
                          <span>Пользователи и доступ</span>
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            navigate('/settings');
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition text-left"
                        >
                          <SettingsIcon className="w-4 h-4 text-[#A9DFD8]" />
                          <span>Параметры и настройки</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/audit');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition text-left"
                    >
                      <FileText className="w-4 h-4 text-[#A9DFD8]" />
                      <span>Журнал действий</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="p-2 border-t border-glass-subtle bg-white/[0.02]">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold text-[#FF5B5B] hover:bg-[#FF5B5B]/15 border border-transparent hover:border-[#FF5B5B]/30 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Выйти из системы (Logout)</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-transparent">
          <Outlet />
        </main>

      </div>

    </div>
  );
};
