import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';
import { authApi, setAuthToken, getAuthToken, removeAuthToken } from '../api/client';
import { getBrand } from '../utils/brand';

export const Login: React.FC = () => {
  const brand = getBrand();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = `${brand.name} | Вход в систему (Gentelella)`;
    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (link) {
      link.href = brand.favicon;
    }

    const token = getAuthToken();
    if (token) {
      authApi.me().then(() => {
        window.location.href = '/';
      }).catch(() => {
        removeAuthToken();
      });
    }
  }, [brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await authApi.login({ username, password });
      if (data.access_token || (data as any).token) {
        window.location.href = '/';
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
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col justify-center items-center p-4 text-[#2A3F54]">
      
      {/* Gentelella Login Card */}
      <div className="w-full max-w-md bg-white border border-[#E6E9ED] rounded-[3px] shadow-sm p-8">
        
        {/* Brand Logo & Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#2A3F54] p-3 flex items-center justify-center shadow-md">
              <img src={brand.emblem} alt={brand.name} className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-[#2A3F54] tracking-tight">
            GuestScreen Control Center
          </h1>
          <p className="text-xs text-[#73879C] mt-1 font-medium">
            {brand.name} · Панель администрирования
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-[#FDF2F2] border border-[#F8B4B4] rounded text-[#E74C3C] text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#73879C] uppercase tracking-wider mb-1.5">
              Имя пользователя
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D2D6DE] rounded text-[#2A3F54] focus:outline-none focus:border-[#1ABB9C] focus:ring-1 focus:ring-[#1ABB9C] transition"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#73879C] uppercase tracking-wider mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#999999]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D2D6DE] rounded text-[#2A3F54] focus:outline-none focus:border-[#1ABB9C] focus:ring-1 focus:ring-[#1ABB9C] transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#1ABB9C] hover:bg-[#169F85] text-white font-bold text-sm rounded shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Авторизация...</span>
                </>
              ) : (
                <span>Войти в систему (Log In)</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-4 border-t border-[#E6E9ED] text-center text-[11px] text-[#73879C]">
          <p>© 2026 Colorlib Gentelella UI · {brand.name} GuestScreen</p>
        </div>

      </div>

    </div>
  );
};
