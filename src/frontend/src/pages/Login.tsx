import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiLockPasswordLine, RiUser3Line, RiAlertLine, RiLoader4Line } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="min-h-screen bg-[#090d16] relative flex items-center justify-center p-4 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#111928] border border-[#1f2a3f] rounded-2xl p-8 shadow-2xl z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex justify-center mb-4"
          >
            <div className="p-3 rounded-xl bg-[#162033] border border-[#23314c] flex items-center justify-center">
              <img src={brand.logo} alt={brand.name} className="h-10 max-w-[180px] object-contain" />
            </div>
          </motion.div>
          <h1 className="text-xl font-bold text-white tracking-tight">GuestScreen Control Center</h1>
          <p className="text-xs text-slate-400 mt-1">{brand.networkSubtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-center space-x-3 text-rose-400 text-xs"
            >
              <RiAlertLine className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Имя пользователя (Логин)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <RiUser3Line className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input w-full pl-10 pr-4"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Пароль
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <RiLockPasswordLine className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-10 pr-4"
                placeholder="••••••••"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RiLoader4Line className="w-4 h-4 animate-spin text-white" />
                <span>Вход в систему...</span>
              </>
            ) : (
              <span>Войти в систему</span>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
