import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, AlertCircle, Loader2, Monitor } from 'lucide-react';
import { authApi, setAuthToken } from '../api/client';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.login({ username, password });
      if (data.access_token || (data as any).token) {
        navigate('/');
      } else {
        throw new Error('Не удалось получить токен авторизации');
      }
    } catch (err: any) {
      setError(err.message || 'Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171821] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#21222D] border border-[#2C2D3A] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo_oqtepa_white.svg" alt="Oqtepa Lavash" className="h-12 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">GuestScreen Control Center</h1>
          <p className="text-xs text-[#87888C] mt-1">Центральное управление экранами и кассами сети Oqtepa Lavash</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF5B5B]/15 border border-[#FF5B5B]/30 rounded-xl flex items-center space-x-3 text-[#FF5B5B] text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#FF5B5B]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#87888C] uppercase tracking-wider mb-2">
              Имя пользователя (Логин)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#87888C]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#87888C] focus:outline-none focus:border-[#A9DFD8] transition-all"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#87888C] uppercase tracking-wider mb-2">
              Пароль
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#87888C]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#171821] border border-[#2C2D3A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#87888C] focus:outline-none focus:border-[#A9DFD8] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[#171821] bg-[#A9DFD8] hover:bg-[#8fd0c8] shadow-md shadow-[#A9DFD8]/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Вход в систему...</span>
              </>
            ) : (
              <span>Войти в систему</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
