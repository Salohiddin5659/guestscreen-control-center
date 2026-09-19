import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  Plus, 
  Shield, 
  Key, 
  Trash2, 
  Edit, 
  UserCheck, 
  Lock, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usersApi, UserAccount, getCurrentUserFromStorage } from '../api/client';

export const UsersView: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUserFromStorage();
  const roleUpper = (currentUser?.role || '').toUpperCase();
  const isPrivileged = roleUpper === 'ADMINISTRATOR' || roleUpper === 'ADMIN' || roleUpper === 'SUPERVISOR';

  useEffect(() => {
    if (!isPrivileged) {
      navigate('/devices', { replace: true });
    }
  }, [isPrivileged, navigate]);

  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserAccount | null>(null);

  // Add User Form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMINISTRATOR' | 'OPERATOR' | 'AUDITOR' | 'SUPERVISOR'>('OPERATOR');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit User Form state
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<string>('OPERATOR');
  const [editFullName, setEditFullName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Load Users from FastAPI GET /api/v1/users
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    enabled: isPrivileged,
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (data: { username: string; password: string; full_name?: string; role?: string }) =>
      usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAddUserOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      setNewRole('OPERATOR');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Ошибка создания пользователя');
    }
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; payload: any }) =>
      usersApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      setEditPassword('');
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.message || 'Ошибка обновления пользователя');
    }
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      alert(`Ошибка удаления пользователя: ${err.message}`);
    }
  });

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMINISTRATOR':
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Администратор
          </span>
        );
      case 'SUPERVISOR':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            Супервайзер
          </span>
        );
      case 'OPERATOR':
      case 'MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            Оператор
          </span>
        );
      case 'AUDITOR':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10">
            Аудитор
          </span>
        );
    }
  };

  const handleOpenEdit = (u: UserAccount) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditFullName(u.full_name || '');
    setEditPassword('');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (editPassword.trim() && editPassword.trim().length < 6) {
      setEditError('Пароль должен содержать минимум 6 символов');
      return;
    }
    setEditError(null);
    const payload: any = {
      role: editRole,
      full_name: editFullName.trim() || undefined,
    };
    if (editPassword.trim()) {
      payload.password = editPassword.trim();
    }
    updateMutation.mutate({ id: editUser.id, payload });
  };

  const handleDeleteUser = (u: UserAccount) => {
    if (u.username === 'admin') {
      alert('Нельзя удалить главного администратора системы (admin)');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${u.username}"?`)) {
      deleteMutation.mutate(u.id);
    }
  };

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const adminCount = users.filter(u => u.role.toUpperCase() === 'ADMINISTRATOR' || u.role.toUpperCase() === 'ADMIN').length;
  const supervisorCount = users.filter(u => u.role.toUpperCase() === 'SUPERVISOR').length;
  const operatorCount = users.filter(u => u.role.toUpperCase() === 'OPERATOR').length;

  if (!isPrivileged) {
    return null;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-white tracking-tight">Пользователи и доступ</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold glass-surface-l2 text-teal-300 border border-white/10">
              {users.length} аккаунтов
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Управление учетными записями операторов, правами доступа и паролями центральной системы
          </p>
        </div>

        <button
          onClick={() => setAddUserOpen(true)}
          className="glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Добавить пользователя</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-surface-l2 glass-specular-edge rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Всего учетных записей</span>
            <span className="text-2xl font-black text-white mt-1 block font-mono">{users.length}</span>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3 h-3" /> Все активны
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-surface-l2 glass-specular-edge rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Администраторы</span>
            <span className="text-2xl font-black text-white mt-1 block font-mono">{adminCount}</span>
            <span className="text-[11px] text-amber-400 font-semibold mt-1 inline-block font-mono">
              ● Полный доступ
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-surface-l2 glass-specular-edge rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Операторы касс</span>
            <span className="text-2xl font-black text-white mt-1 block font-mono">{operatorCount}</span>
            <span className="text-[11px] text-teal-300 font-semibold mt-1 inline-block font-mono">
              ● Управление кассами и медиа
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center justify-center shadow-sm">
            <Key className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-surface-l2 glass-specular-edge rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            Загрузка списка пользователей...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-black/20 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-5">Пользователь</th>
                  <th className="py-3.5 px-5">ФИО</th>
                  <th className="py-3.5 px-5">Роль</th>
                  <th className="py-3.5 px-5">Статус</th>
                  <th className="py-3.5 px-5">Дата регистрации</th>
                  <th className="py-3.5 px-5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {users.map((u) => {
                  const isCurrent = currentUser?.username === u.username;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-teal-300 font-bold text-xs flex items-center justify-center shadow-inner">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white block">
                              {u.username}
                              {isCurrent && (
                                <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                  Текущий
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {u.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-medium text-slate-300">
                        {u.full_name || '—'}
                      </td>

                      <td className="py-4 px-5">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Активен
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-slate-400">
                        {formatDateTime(u.created_at)}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-teal-300 transition-colors"
                            title="Редактировать / Сменить пароль"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                              title="Удалить пользователя"
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
        )}
      </div>

      {/* Add User Modal */}
      {addUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Создать пользователя</h3>
                  <p className="text-[11px] text-slate-400">Логин и пароль для входа в панель управления</p>
                </div>
              </div>
              <button onClick={() => setAddUserOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newUsername.trim() || !newPassword.trim()) {
                setFormError('Заполните логин и пароль');
                return;
              }
              if (newUsername.trim().length < 3) {
                setFormError('Имя пользователя должно содержать минимум 3 символа');
                return;
              }
              if (newPassword.trim().length < 4) {
                setFormError('Пароль должен содержать минимум 4 символа');
                return;
              }
              setFormError(null);
              createMutation.mutate({
                username: newUsername.trim(),
                password: newPassword.trim(),
                full_name: newFullName.trim() || undefined,
                role: newRole,
              });
            }} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Имя пользователя (Логин) *</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  placeholder="operator_1"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Минимум 3 символа (буквы, цифры)</span>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">ФИО / Описание</label>
                <input
                  type="text"
                  placeholder="Иван Иванов"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Пароль *</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Минимум 4 символа</span>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Роль и привилегии *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="glass-input w-full px-3.5 py-2 text-white focus:outline-none"
                >
                  <option value="OPERATOR">Оператор (Управление рекламой и мониторинг касс)</option>
                  <option value="SUPERVISOR">Супервайзер (Управление кассами, рекламой и аудитом)</option>
                  <option value="ADMINISTRATOR">Администратор (Полный доступ к системе и пользователям)</option>
                  <option value="AUDITOR">Аудитор (Только просмотр и логи)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {newRole === 'ADMINISTRATOR' && 'Полный доступ: управление кассами, рекламой, настройками и пользователями'}
                  {newRole === 'SUPERVISOR' && 'Расширенный доступ: управление кассами, медиа, шаблонами, распределением и аудитом'}
                  {newRole === 'OPERATOR' && 'Рабочий доступ: мониторинг касс и ресторанов, управление медиатекой, рекламой и шаблонами (без права редактирования структуры касс и филиалов)'}
                  {newRole === 'AUDITOR' && 'Только просмотр: мониторинг состояния и аудит-логи'}
                </span>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddUserOpen(false)}
                  className="glass-btn-secondary px-4 py-2 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="glass-btn-primary px-4 py-2 rounded-xl font-bold disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Создание...' : 'Создать аккаунт'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-surface-l4 glass-specular-edge rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Редактировать: {editUser.username}</h3>
                  <p className="text-[11px] text-slate-400">Изменение роли или сброс пароля</p>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} className="p-1 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  {editError}
                </div>
              )}

              <div>
                <label className="text-slate-400 font-semibold block mb-1">ФИО / Описание</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Роль</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-white focus:outline-none"
                >
                  <option value="OPERATOR">Оператор (Управление рекламой и мониторинг касс)</option>
                  <option value="SUPERVISOR">Супервайзер (Управление кассами, рекламой и аудитом)</option>
                  <option value="ADMINISTRATOR">Администратор (Полный доступ к системе и пользователям)</option>
                  <option value="AUDITOR">Аудитор (Только просмотр и логи)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Новый пароль (оставьте пустым, если не меняется)</label>
                <input
                  type="password"
                  placeholder="Новый пароль"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="glass-input w-full px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="glass-btn-secondary px-4 py-2 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="glass-btn-primary px-4 py-2 rounded-xl font-bold disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
