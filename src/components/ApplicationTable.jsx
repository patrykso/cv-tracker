import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, useConfig, getStatusColors, getDisplayName } from '../db';
import { Search, Plus, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { pl as plLocale, enUS as enLocale } from 'date-fns/locale';
import { cn } from '../utils';
import { useTranslation } from '../i18n';

// Helper component for custom dropdown
function StatusDropdown({ currentStatus, statuses, onChange, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDef = statuses.find(s => s.id === currentStatus);
  const currentLabel = getDisplayName(currentDef, t);

  return (
    <div className="relative" ref={dropdownRef} onClick={e => e.stopPropagation()}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 w-max rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase border cursor-pointer select-none transition-colors",
          getStatusColors(currentDef?.color)
        )}
      >
        {currentLabel}
        <ChevronDown size={14} className={cn("transition-transform opacity-60", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] w-max bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {statuses.map(st => {
            const label = getDisplayName(st, t);
            const isSelected = st.id === currentStatus;
            
            return (
              <div 
                key={st.id}
                onClick={() => {
                  onChange(st.id);
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
              >
                <div className={cn("w-2 h-2 rounded-full", getStatusColors(st.color).split(' ')[0])} />
                <span className="flex-1">{label}</span>
                {isSelected && <Check size={14} className="text-zinc-400" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ApplicationTable({ onRowClick }) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dateApplied', direction: 'desc' });
  const [showModal, setShowModal] = useState(false);
  const { t, lang } = useTranslation();
  const config = useConfig();
  
  const currentLocale = lang === 'pl' ? plLocale : enLocale;

  const applications = useLiveQuery(
    async () => {
      let collection = db.applications;
      const results = await collection.toArray();
      
      let filtered = results;
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(app => 
          app.company.toLowerCase().includes(s) || 
          app.position.toLowerCase().includes(s)
        );
      }
      
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      
      return filtered;
    },
    [search, sortConfig]
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const date = new Date().toISOString();
    
    const id = await db.applications.add({
      company: fd.get('company'),
      position: fd.get('position'),
      status: fd.get('status'),
      dateApplied: date,
      lastUpdate: date,
    });

    await db.stages.add({
      appId: id,
      type: fd.get('status'),
      date: date,
      notes: t('initialApplication')
    });

    setShowModal(false);
  };

  const updateStatus = async (e, id, newStatus) => {
    if (e) e.stopPropagation();
    try {
      await db.applications.update(id, { 
        status: newStatus,
        lastUpdate: new Date().toISOString()
      });
      await db.stages.add({
        appId: id,
        type: newStatus,
        date: new Date().toISOString(),
        notes: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!config) return null;

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-sans">{t('titleApplications')}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors border border-indigo-600"
          >
            <Plus size={16} />
            {t('newApp')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20">
        <table className="w-full text-left text-sm border-collapse table-fixed">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold tracking-wider text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900/50">
              <th className="w-[20%] p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200" onClick={() => handleSort('company')}>
                <div className="flex items-center gap-1">{t('colCompany')} <ArrowUpDown size={12} /></div>
              </th>
              <th className="w-[30%] p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200" onClick={() => handleSort('position')}>
                <div className="flex items-center gap-1">{t('colPosition')} <ArrowUpDown size={12} /></div>
              </th>
              <th className="w-[20%] p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">{t('colStatus')} <ArrowUpDown size={12} /></div>
              </th>
              <th className="w-[15%] p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200" onClick={() => handleSort('dateApplied')}>
                <div className="flex items-center gap-1">{t('colApplied')} <ArrowUpDown size={12} /></div>
              </th>
              <th className="w-[15%] p-4 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200" onClick={() => handleSort('lastUpdate')}>
                <div className="flex items-center gap-1">{t('colActivity')} <ArrowUpDown size={12} /></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {!applications?.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-600 dark:text-zinc-400 font-medium">
                  {t('noApps')}
                </td>
              </tr>
            )}
            {applications?.map(app => {
              const currentStatusDef = config.statuses.find(s => s.id === app.status) || config.statuses[1];
              
              return (
              <tr 
                key={app.id} 
                onClick={() => onRowClick(app.id)}
                className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors"
              >
                <td className="p-4 truncate">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md shrink-0 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-300 text-xs group-hover:bg-indigo-500 group-hover:text-white transition-colors border border-zinc-300/50 dark:border-zinc-700">
                      {app.company.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{app.company}</span>
                  </div>
                </td>
                <td className="p-4 font-medium text-zinc-700 dark:text-zinc-300 truncate">{app.position}</td>
                <td className="p-4 relative">
                  <StatusDropdown 
                    currentStatus={app.status} 
                    statuses={config.statuses} 
                    onChange={(newStatus) => updateStatus(null, app.id, newStatus)} 
                    t={t} 
                  />
                </td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400 font-mono text-sm truncate">
                  {format(new Date(app.dateApplied), 'yyyy-MM-dd')}
                </td>
                <td className="p-4 text-zinc-600 dark:text-zinc-400 font-medium text-sm truncate">
                  {formatDistanceToNow(new Date(app.lastUpdate), { addSuffix: true, locale: currentLocale })}
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">{t('newApp')}</h3>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">{t('companyLabel')}</label>
                  <input required name="company" className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium" placeholder={t('companyPlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">{t('positionLabel')}</label>
                  <input required name="position" className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium" placeholder={t('positionPlaceholder')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-1">{t('statusLabel')}</label>
                  <select name="status" className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-indigo-500 font-medium cursor-pointer">
                    {config.statuses.map(st => (
                      <option key={st.id} value={st.id}>{getDisplayName(st, t)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">{t('cancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl border border-indigo-600 shadow-sm transition-colors">{t('create')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
