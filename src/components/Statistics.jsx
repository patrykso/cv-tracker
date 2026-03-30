import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, useConfig } from '../db';
import { toPng } from 'html-to-image';
import { useTranslation } from '../i18n';
import { cn } from '../utils';
import { Download, LayoutPanelLeft, Subtitles, Smartphone, Target, Inbox, Ban, Ghost, Clock, Activity, Briefcase } from 'lucide-react';
import { subDays, format, isSameDay } from 'date-fns';

export default function Statistics() {
  const { t } = useTranslation();
  const config = useConfig();
  const exportRef = useRef(null);
  const [exportFormat, setExportFormat] = useState('vertical');
  const [isExporting, setIsExporting] = useState(false);

  const stats = useLiveQuery(async () => {
    const apps = await db.applications.toArray();
    const stages = await db.stages.toArray();

    const totalApps = apps.length;
    let offers = 0;
    let rejected = 0;
    let ghosted = 0;
    let inProgress = 0;
    
    let appsWithInterview = new Set();
    
    apps.forEach(app => {
      if (app.status === 'Offer') offers++;
      else if (app.status === 'Rejected') rejected++;
      else if (app.status === 'Ghosted') ghosted++;
      else inProgress++;
    });

    stages.forEach(stage => {
      if (!['Inquiry', 'Applied', 'Rejected', 'Ghosted', 'GenericNote', 'Offer'].includes(stage.type)) {
        appsWithInterview.add(stage.appId);
      }
    });

    const interviews = appsWithInterview.size;
    const interviewRate = totalApps > 0 ? Math.round((interviews / totalApps) * 100) : 0;
    const rejectionRate = totalApps > 0 ? Math.round((rejected / totalApps) * 100) : 0;
    const ghostedRate = totalApps > 0 ? Math.round((ghosted / totalApps) * 100) : 0;
    const inProgressRate = totalApps > 0 ? Math.round((inProgress / totalApps) * 100) : 0;
    const offerRate = totalApps > 0 ? Math.round((offers / totalApps) * 100) : 0;

    // Calculate Last 14 days chart data
    const chartData = [];
    let maxDaily = 0;
    for (let i = 13; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const count = apps.filter(a => isSameDay(new Date(a.dateApplied), day)).length;
      if (count > maxDaily) maxDaily = count;
      chartData.push({
        date: day,
        label: format(day, 'dd.MM'),
        count
      });
    }

    return { totalApps, interviews, offers, rejected, ghosted, inProgress, interviewRate, rejectionRate, ghostedRate, inProgressRate, offerRate, chartData, maxDaily };
  }, []);

  const handleExport = async () => {
    setTimeout(async () => {
      if (!exportRef.current) return;
      try {
        setIsExporting(true);
        const dataUrl = await toPng(exportRef.current, { 
          quality: 1, 
          pixelRatio: 2,
          style: { transform: 'scale(1)', margin: '0' }
        });
        const link = document.createElement('a');
        link.download = `cvtrack-stats-${exportFormat}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to export image', err);
      } finally {
        setIsExporting(false);
      }
    }, 150);
  };

  if (!stats || !config) return <div className="p-8 text-zinc-500 font-medium">Loading...</div>;

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full max-w-6xl mx-auto flex flex-col gap-12">
      
      {/* 1. Dashboard View */}
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-sans">{t('statsTitle')}</h1>
          <p className="text-zinc-500 font-medium mt-1">{t('statsDesc')}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 text-zinc-500 mb-2">
              <Inbox size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{t('statsTotal')}</span>
            </div>
            <div className="text-4xl font-black text-zinc-900 dark:text-zinc-100">{stats.totalApps}</div>
          </div>
          
          <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 text-indigo-500 mb-2">
              <Target size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{t('statsInterviews')}</span>
            </div>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{stats.interviews}</div>
            <div className="text-sm font-medium text-indigo-500/70 mt-1">{stats.interviewRate}% {t('statsRateAllStr')}</div>
          </div>

          <div className="p-6 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-2">
              <Briefcase size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{t('statsOffers')}</span>
            </div>
            <div className="text-4xl font-black text-emerald-700 dark:text-emerald-400">{stats.offers}</div>
            <div className="text-sm font-medium text-emerald-600/70 mt-1">{stats.offerRate}% {t('statsRateAllStr')}</div>
          </div>

          <div className="p-6 bg-teal-50 dark:bg-teal-500/5 border border-teal-100 dark:border-teal-500/20 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400 mb-2">
              <Activity size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{t('statsInProgress')}</span>
            </div>
            <div className="text-4xl font-black text-teal-700 dark:text-teal-400">{stats.inProgress}</div>
            <div className="text-sm font-medium text-teal-600/70 mt-1">{stats.inProgressRate}% {t('statsRateAllStr')}</div>
          </div>
          
          <div className="p-6 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <Ban size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{t('statsRejectedTitle')}</span>
            </div>
            <div className="text-4xl font-black text-red-600 dark:text-red-400">{stats.rejected}</div>
            <div className="text-sm font-medium text-red-500/70 mt-1">{stats.rejectionRate}% {t('statsRateAllStr')}</div>
          </div>
          
          <div className="p-6 bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 text-zinc-500 mb-2">
              <Ghost size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">{t('statsGhostedTitle')}</span>
            </div>
            <div className="text-4xl font-black text-zinc-600 dark:text-zinc-400">{stats.ghosted}</div>
            <div className="text-sm font-medium text-zinc-500 mt-1">{stats.ghostedRate}% {t('statsRateAllStr')}</div>
          </div>
        </div>

        {/* 1.5 - Chart Section */}
        <div className="mt-8 p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="mb-6">
            <span className="text-sm font-bold uppercase tracking-wider text-zinc-500">{t('statsActivity')}</span>
          </div>
          <div className="flex items-end justify-between h-48 gap-2">
            {stats.chartData.map((data, i) => {
              const height = stats.maxDaily > 0 ? (data.count / stats.maxDaily) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group h-full">
                  <div className="opacity-0 group-hover:opacity-100 text-xs font-bold text-indigo-500 transition-opacity min-h-[16px]">
                    {data.count}
                  </div>
                  <div className="w-full h-40 bg-zinc-100 dark:bg-zinc-800/40 rounded-t-sm flex items-end relative overflow-hidden">
                    <div 
                      className="w-full bg-indigo-200 dark:bg-indigo-500/40 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 transition-all duration-300 rounded-t-sm"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono tracking-tighter truncate w-full text-center mt-1">
                    {data.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <hr className="border-t border-zinc-200 dark:border-zinc-800" />

      {/* 2. Image Export Utility */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('statsExportTitle')}</h3>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setExportFormat('vertical')}
              className={cn(
                "w-full flex items-center p-4 rounded-xl transition-all shadow-sm border",
                exportFormat === 'vertical' ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500" : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-500/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Smartphone size={18} className={exportFormat === 'vertical' ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"} />
                <span className={cn("font-bold text-sm", exportFormat === 'vertical' ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-700 dark:text-zinc-300")}>{t('statsFormatVertical')}</span>
              </div>
            </button>
            <button 
              onClick={() => setExportFormat('square')}
              className={cn(
                "w-full flex items-center p-4 rounded-xl transition-all shadow-sm border",
                exportFormat === 'square' ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500" : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-500/50"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutPanelLeft size={18} className={exportFormat === 'square' ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"} />
                <span className={cn("font-bold text-sm", exportFormat === 'square' ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-700 dark:text-zinc-300")}>{t('statsFormatSquare')}</span>
              </div>
            </button>
            <button 
              onClick={() => setExportFormat('banner')}
              className={cn(
                "w-full flex items-center p-4 rounded-xl transition-all shadow-sm border",
                exportFormat === 'banner' ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500" : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:border-indigo-500/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Subtitles size={18} className={exportFormat === 'banner' ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500"} />
                <span className={cn("font-bold text-sm", exportFormat === 'banner' ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-700 dark:text-zinc-300")}>{t('statsFormatBanner')}</span>
              </div>
            </button>
          </div>

          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full mt-2 py-4 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            <Download size={18} />
            {isExporting ? '...' : t('statsExportBtn')}
          </button>
        </div>

        {/* The Exportable Ref Card */}
        <div className="md:w-2/3 flex overflow-x-auto w-full bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-4 lg:p-8">
         <div className="m-auto">
          <div 
            ref={exportRef}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-2xl shadow-2xl p-8 lg:p-12 text-[#f4f4f5] overflow-hidden shrink-0",
              exportFormat === 'vertical' && "w-[360px] h-[640px] aspect-[9/16]",
              exportFormat === 'square' && "w-[500px] h-[500px] aspect-square",
              exportFormat === 'banner' && "w-[800px] h-[400px] aspect-[2/1]" 
            )}
            style={{
              backgroundColor: '#09090b',
              backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(79, 70, 229, 0.15), transparent 50%), radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.15), transparent 50%)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] opacity-20 pointer-events-none"></div>

            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between">

              <div className="flex flex-col items-center gap-6 my-auto text-center w-full">
                <div>
                  <div className={cn("font-black tracking-tight", exportFormat === 'banner' ? "text-6xl" : "text-7xl md:text-8xl")} style={{ color: '#ffffff' }}>
                    {stats.totalApps}
                  </div>
                  <div className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: '#a1a1aa' }}>{t('statsTotal')}</div>
                </div>
                
                <div className={cn(
                  "grid gap-4 w-full",
                  exportFormat === 'banner' ? "grid-cols-4 mt-2" : "grid-cols-2 mt-6"
                )}>
                  <div className="flex flex-col items-center p-4 rounded-xl border" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="text-2xl font-bold mb-1" style={{ color: '#ffffff' }}>{stats.interviews}</div>
                    <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: '#a1a1aa' }}>{t('statsInterviews')}</div>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl border" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    <div className="text-2xl font-bold mb-1" style={{ color: '#34d399' }}>{stats.offers}</div>
                    <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'rgba(52, 211, 153, 0.8)' }}>{t('statsOffers')}</div>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <div className="text-2xl font-bold mb-1" style={{ color: '#f87171' }}>{stats.rejected}</div>
                    <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'rgba(248, 113, 113, 0.8)' }}>{t('Rejected')}</div>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-xl border" style={{ backgroundColor: 'rgba(113, 113, 122, 0.1)', borderColor: 'rgba(113, 113, 122, 0.2)' }}>
                    <div className="text-2xl font-bold mb-1" style={{ color: '#a1a1aa' }}>{stats.ghosted}</div>
                    <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'rgba(161, 161, 170, 0.8)' }}>{t('statsGhostedTitle')}</div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 opacity-50 text-[10px] font-mono tracking-widest text-[#a1a1aa]">
                patrykso.github.io/cv-tracker
              </div>
            </div>
          </div>
         </div>
        </div>
      </div>

    </div>
  );
}
