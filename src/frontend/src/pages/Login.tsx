import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, AlertCircle, Loader2, Monitor } from 'lucide-react';
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
    document.title = `${brand.name} | Вход в систему`;
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
    <div className="min-h-screen" style={{ background: 'var(--color-bg-base)' }}>
      {/* Spatial background layers */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: 'var(--color-bg-base)' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(100,220,200,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, rgba(80,160,255,0.35) 0%, transparent 70%)' }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="glass-surface-l4 glass-specular-edge liquid-chromatic-edge rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-up relative">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner flex items-center justify-center">
                <img src={brand.logo} alt={brand.name} className="h-12 max-w-[200px] object-contain" />
              </div>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">GuestScreen Control Center</h1>
            <p className="text-xs text-slate-400 mt-1">{brand.networkSubtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Имя пользователя (Логин)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-btn-primary liquid-interactive w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 disabled:opacity-50 relative overflow-hidden shadow-lg"
            >
              <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
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
    </div>
  );
};
