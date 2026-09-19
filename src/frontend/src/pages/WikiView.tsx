import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  Check, 
  Copy, 
  Terminal, 
  Monitor, 
  Layers, 
  HardDrive, 
  HelpCircle, 
  AlertCircle,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const WikiView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'screens' | 'admin' | 'operator' | 'backup' | 'faq'>('overview');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const tabs = [
    { id: 'overview', label: '1. Быстрый старт и Фото касс', icon: Monitor },
    { id: 'screens', label: '2. Зоны экранов (1024x768 / 512x768)', icon: Layers },
    { id: 'admin', label: '3. Подключение кассы (Сисадмину)', icon: Terminal },
    { id: 'operator', label: '4. Публикация и Волны (Маркетологу)', icon: Zap },
    { id: 'backup', label: '5. Бэкапы и Восстановление', icon: HardDrive },
    { id: 'faq', label: '6. Частые вопросы (FAQ)', icon: HelpCircle },
  ];

  const psCode = `# 1. Установка компонента OpenSSH Server в Windows
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# 2. Настройка автоматического запуска службы SSH при включении кассы
Set-Service -Name sshd -StartupType 'Automatic'
Start-Service sshd

# 3. Открытие порта 22 в брандмауэре Windows
New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22`;

  const restoreCode = `# Восстановление базы данных PostgreSQL из дампа:
ssh root@10.0.0.111
docker exec -i guestscreen_postgres16 psql -U postgres -c "DROP DATABASE IF EXISTS gs_control_center;"
docker exec -i guestscreen_postgres16 psql -U postgres -c "CREATE DATABASE gs_control_center;"
docker exec -i guestscreen_postgres16 psql -U postgres -d gs_control_center < /opt/guestscreen-server/backups/gs_control_center_dump.sql
docker restart guestscreen_fastapi_server`;

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 font-sans antialiased selection:bg-[#A9DFD8] selection:text-[#070b12]">
      {/* Top Standalone Header */}
      <header className="sticky top-0 z-50 glass-surface-l3 border-b border-glass-elevated px-6 py-3.5 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/oqtepa_emblem.svg" 
              alt="Oqtepa Lavash" 
              className="w-9 h-9 rounded-xl shadow-lg shadow-[#C81E28]/25 object-contain ring-1 ring-white/10" 
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-tight text-white uppercase">Oqtepa Lavash</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-glass-cyan text-[#A9DFD8] font-mono border border-[#A9DFD8]/30">
                  Wiki v3.2
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">GuestScreen Control Center • База знаний</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="/downloads/GuestScreen_Wiki_Manual.docx"
              download="GuestScreen_Wiki_Manual.docx"
              className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать Word (.docx)</span>
            </a>
            <a
              href="/devices"
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <span>В панель управления</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6">
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
          {/* Top Banner with Docx Download */}
          <div className="glass-surface-l1 rounded-2xl p-6 border border-glass-elevated relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1E88E5]/20 to-[#0D47A1]/40 border border-[#1E88E5]/30 text-[#60A5FA]">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Краткая база знаний и Руководство (Wiki)</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F766E]/30 text-[#A9DFD8] border border-[#0F766E]/50">
                v3.2 со скриншотами
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Наглядная шпаргалка: фото оборудования, схемы экранов, подключение касс за 2 минуты, волновой деплой рекламы и бэкапы.
            </p>
          </div>
        </div>

        {/* Download Word DOCX button */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <a
            href="/downloads/GuestScreen_Wiki_Manual.docx"
            download="GuestScreen_Wiki_Manual.docx"
            className="flex items-center justify-center space-x-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all w-full md:w-auto group border border-blue-400/30"
          >
            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Скачать Word (.docx со скриншотами)</span>
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-glass-subtle">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#A9DFD8]/20 to-[#60A5FA]/20 text-white border border-[#A9DFD8]/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#A9DFD8]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">

        {/* TAB 1: OVERVIEW & HARDWARE PHOTOS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="glass-surface-l2 rounded-2xl p-6 border border-glass-subtle space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Обзор системы и архитектура Zero-Agent</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400">Сервер управления:</div>
                  <div className="text-white font-mono font-bold text-sm mt-0.5">10.0.0.111:8101</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400">Сеть касс:</div>
                  <div className="text-cyan-400 font-bold text-sm mt-0.5">43 активных кассы (100% готовность)</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400">Технология:</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">Zero-Agent Push (чистый SSH)</div>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                На кассовых моноблоках <strong>нет сторонних агентов или демонов</strong>. Сервер сам подключается по протоколу SSH Windows, 
                записывает сцены в базу <code>gs.db</code> и бесшовно обновляет витрину на глазах у гостя без перезапуска программы кассира.
              </p>

              {/* Photos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
                    <img 
                      src="/wiki_images/1_pos_hardware.jpg" 
                      alt="Кассовый моноблок" 
                      className="rounded-lg object-cover max-h-72 w-full"
                    />
                  </div>
                  <p className="text-xs text-slate-400 italic text-center">
                    📸 Фото 1. Кассовый моноблок с экраном покупателя (DISPLAY2) в ресторане Oqtepa Lavash
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
                    <img 
                      src="/wiki_images/2_pos_screen_live.jpg" 
                      alt="Рабочий экран гостя" 
                      className="rounded-lg object-cover max-h-72 w-full"
                    />
                  </div>
                  <p className="text-xs text-slate-400 italic text-center">
                    📸 Фото 2. Экран гостя в боевом режиме: живой чек заказа r_keeper и промо-реклама
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCREEN SIZES */}
        {activeTab === 'screens' && (
          <div className="space-y-6">
            <div className="glass-surface-l2 rounded-2xl p-6 border border-glass-subtle space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <span>Зоны экранов и точные размеры баннеров (Шпаргалка)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">1. FULL SCREEN (Ожидание)</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">1024 × 768 px</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Показывается, когда кассир свободен и чек пуст. Полноэкранный имиджевый баннер или слайдшоу (4:3).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">2. 50/50 PROMO (Экран заказа)</span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">512 × 768 px</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Показывается при добавлении блюд в чек. Слева (512px) — защищенный чек r_keeper, справа (512px) — промо-баннер допродаж.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-200/90 leading-relaxed">
                  <strong>Правило для дизайнеров:</strong> Никогда не загружайте баннеры 16:9 (1920×1080)! Монитор кассы строго 4:3 (1024×768). Неправильные форматы сплющатся или обрежутся.
                </div>
              </div>

              {/* Screenshot 3 */}
              <div className="space-y-2 pt-2">
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
                  <img 
                    src="/wiki_images/3_screen_zones_layout.png" 
                    alt="Схема экранов GuestScreen" 
                    className="rounded-lg object-contain max-h-96 w-full"
                  />
                </div>
                <p className="text-xs text-slate-400 italic text-center">
                  📸 Скриншот 3. Схема разделения экранов GuestScreen: полноэкранный режим и режим 50/50
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN & CASHIER SETUP */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="glass-surface-l2 rounded-2xl p-6 border border-glass-subtle space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <span>Подключение новой кассы за 2 минуты (Сисадмину)</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                    Шаг 1. На кассе в PowerShell от Администратора:
                  </span>
                  <button
                    onClick={() => handleCopy(psCode, 'ps-admin')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-all"
                  >
                    {copiedSnippet === 'ps-admin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'ps-admin' ? 'Скопировано!' : 'Копировать команды'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
                  {psCode}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Обязательно:</strong> У пользователя Windows на кассе (Administrator) должен быть задан пароль. С пустым паролем Windows блокирует сетевой вход по SSH.
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <h3 className="font-bold text-white text-sm">Шаг 2. Регистрация в панели:</h3>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Зайдите в раздел <strong>Кассы (/devices)</strong> и нажмите <strong>«+ Добавить кассу»</strong>.</li>
                  <li>Введите IP-адрес (например, <code>192.168.129.201</code>), выберите филиал, введите логин и пароль SSH.</li>
                  <li>В карточке кассы нажмите кнопку <strong>«SSH тест»</strong>. Сервер автоматически свяжется с кассой, развернет <code>sqlite3.exe</code> и хук live-reload. Статус станет зеленым «Online».</li>
                </ol>
              </div>

              {/* Screenshot 4 */}
              <div className="space-y-2 pt-2">
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
                  <img 
                    src="/wiki_images/4_dashboard_devices.png" 
                    alt="Реестр касс сети" 
                    className="rounded-lg object-contain max-h-96 w-full"
                  />
                </div>
                <p className="text-xs text-slate-400 italic text-center">
                  📸 Скриншот 4. Реестр касс сети Oqtepa Lavash в панели управления: IP, задержка и статусы онлайн
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OPERATOR & WAVES */}
        {activeTab === 'operator' && (
          <div className="space-y-6">
            <div className="glass-surface-l2 rounded-2xl p-6 border border-glass-subtle space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Публикация рекламы и волновой деплой (Маркетологу)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">1</div>
                  <h4 className="font-bold text-white">Загрузка баннера</h4>
                  <p className="text-slate-400">В <strong>/media</strong> загрузите файл 1024x768 или 512x768. Хеш SHA-256 предотвратит дубликаты.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">2</div>
                  <h4 className="font-bold text-white">Создание шаблона</h4>
                  <p className="text-slate-400">В <strong>/playlists</strong> выберите зону экрана, статичный баннер или слайдшоу (смена 5–7 сек).</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">3</div>
                  <h4 className="font-bold text-white">Запуск публикации</h4>
                  <p className="text-slate-400">Нажмите «Опубликовать» (самолетик) и выберите таргетинг: вся сеть, филиал или отдельные кассы.</p>
                </div>
              </div>

              {/* Screenshot 5 */}
              <div className="space-y-2 pt-2">
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
                  <img 
                    src="/wiki_images/5_publish_wizard.png" 
                    alt="Мастер таргетинга публикации" 
                    className="rounded-lg object-contain max-h-80 w-full"
                  />
                </div>
                <p className="text-xs text-slate-400 italic text-center">
                  📸 Скриншот 5. Мастер таргетинга публикации рекламы по ресторанам сети Oqtepa Lavash
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-bold text-white text-sm">Волновая доставка и кнопка «Повторить неудачные»:</h4>
                <p className="text-slate-400 leading-relaxed">
                  Сервер отправляет рекламу пачками <strong>по 3 кассы одновременно</strong> (максимум 2 кассы на ресторан), 
                  чтобы не забивать интернет-каналы заведений. Если какие-то кассы были выключены, после окончания деплоя 
                  нажмите кнопку <strong>«Повторить неудачные»</strong> — сервер повторит доставку только на них.
                </p>
              </div>

              {/* Screenshot 6 */}
              <div className="space-y-2 pt-2">
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center p-2">
                  <img 
                    src="/wiki_images/6_wave_deployment.png" 
                    alt="Окно мониторинга деплоя" 
                    className="rounded-lg object-contain max-h-96 w-full"
                  />
                </div>
                <p className="text-xs text-slate-400 italic text-center">
                  📸 Скриншот 6. Окно мониторинга доставки в реальном времени со статусами каждой кассы
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BACKUP */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="glass-surface-l2 rounded-2xl p-6 border border-glass-subtle space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-blue-400" />
                <span>Резервное копирование и Восстановление базы</span>
              </h2>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <h4 className="font-bold text-white">Каталог резервных копий:</h4>
                <p className="font-mono text-cyan-300">D:\GuestScreen Server\</p>
                <p className="text-slate-400">Содержит полные SQL-дампы базы, конфигурации, веб-интерфейс и медиафайлы.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                    Восстановление базы PostgreSQL из дампа:
                  </span>
                  <button
                    onClick={() => handleCopy(restoreCode, 'restore-code')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-all"
                  >
                    {copiedSnippet === 'restore-code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'restore-code' ? 'Скопировано!' : 'Копировать команды'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-cyan-300 border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
                  {restoreCode}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FAQ */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div className="glass-surface-l2 rounded-2xl p-6 border border-glass-subtle space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <span>Шпаргалка по частым инцидентам (FAQ)</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-white text-sm">❓ Что делать, если касса горит статусом «Оффлайн»?</h4>
                  <p className="text-slate-400 leading-relaxed">
                    1. Проверьте питание моноблока кассы и кабель локальной сети.<br />
                    2. Проверьте сетевой отклик: <code>ping IP_КАССЫ</code>.<br />
                    3. В PowerShell кассы проверьте службу SSH: <code>Get-Service sshd</code> (если остановлена — <code>Start-Service sshd</code>).<br />
                    4. Если сменился пароль администратора на моноблоке, обновите его в свойствах кассы в панели.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-white text-sm">❓ На мониторе гостя остался старый баннер после публикации.</h4>
                  <p className="text-slate-400 leading-relaxed">
                    1. Убедитесь, что приложение <code>GuestScreen.exe</code> запущено на моноблоке кассы.<br />
                    2. Проверьте время изменения файла <code>C:\UCS\GuestScreen\Front\sync_version.txt</code>.<br />
                    3. Если кассир закрыл окно, запустите ярлык <code>GuestScreen.exe</code> на рабочем столе кассы.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                  <h4 className="font-bold text-white text-sm">❓ Безопасно ли обновлять рекламу во время пробития чеков?</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Абсолютно безопасно. Запись рекламы происходит в безопасном режиме SQLite WAL за доли миллисекунды. Чеки и фискальные операции r_keeper не затрагиваются.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
    </main>
    </div>
  );
};
