import { useState, useEffect } from 'react';
import { Briefcase, Settings, Moon, Sun, BarChart2 } from 'lucide-react';
import { cn } from './utils';
import { useTranslation } from './i18n';
import { db, useConfig } from './db';
import ApplicationTable from './components/ApplicationTable';
import SettingsView from './components/Settings';
import SidePanel from './components/SidePanel';
import StatisticsView from './components/Statistics';

export default function App() {
  const [activeView, setActiveView] = useState('applications');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const { t, lang, changeLang } = useTranslation();
  const config = useConfig();
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Auto-Ghosting logic
  useEffect(() => {
    if (!config) return;
    const runGhosting = async () => {
      const intervalDays = config.ghostedInterval || 14;
      const thresholdTime = new Date().getTime() - (intervalDays * 24 * 60 * 60 * 1000);
      
      const apps = await db.applications.toArray();
      const ghostable = apps.filter(app => {
        const isClosed = ['Offer', 'Rejected', 'Ghosted'].includes(app.status);
        if (isClosed) return false;
        return new Date(app.lastUpdate).getTime() < thresholdTime;
      });

      if (ghostable.length > 0) {
        for (const app of ghostable) {
          await db.applications.update(app.id, {
            status: 'Ghosted',
            lastUpdate: new Date().toISOString()
          });
          await db.stages.add({
            appId: app.id,
            type: 'Ghosted',
            date: new Date().toISOString(),
            notes: `Auto-ghosted after ${intervalDays} days of inactivity.`
          });
        }
      }
    };
    runGhosting();
  }, [config]);

  const toggleLang = () => {
    changeLang(lang === 'en' ? 'pl' : 'en');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30">
      
      <nav className="w-64 border-r border-zinc-200 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/30 flex flex-col justify-between">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div>
              <h1 className="font-bold text-lg tracking-tight">CV Tracker</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-0.5">{t('freeAndPrivate')}</p>
            </div>
          </div>
          
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => setActiveView('applications')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors",
                  activeView === 'applications' 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                )}
              >
                <Briefcase size={16} />
                {t('navApp')}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveView('statistics')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors",
                  activeView === 'statistics' 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                )}
              >
                <BarChart2 size={16} />
                {t('navStats')}
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveView('settings')}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm rounded-md transition-colors",
                  activeView === 'settings' 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium" 
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50"
                )}
              >
                <Settings size={16} />
                {t('navSettings')}
              </button>
            </li>
          </ul>
        </div>
        
        <div className="p-4 flex flex-col gap-3 border-t border-zinc-200/50 dark:border-zinc-800/40">
          <p className="text-[10px] text-zinc-500 leading-relaxed font-medium text-center">
            {t('privacyNotice')}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title={t(isDarkMode ? 'lightMode' : 'darkMode')}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            
            <button 
              onClick={toggleLang}
              className="flex-none w-10 flex items-center justify-center gap-2 px-2 py-2 text-xs font-bold font-mono rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors uppercase"
              title="Toggle Language"
            >
              {lang}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {activeView === 'applications' && <ApplicationTable onRowClick={(id) => setSelectedAppId(id)} />}
        {activeView === 'statistics' && <StatisticsView />}
        {activeView === 'settings' && <SettingsView />}
        
        <SidePanel 
          appId={selectedAppId} 
          isOpen={!!selectedAppId} 
          onClose={() => setSelectedAppId(null)} 
        />
      </main>
    </div>
  );
}
