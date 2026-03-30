import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, useConfig, getStatusColors, getDisplayName } from '../db';
import { X, Building2, DollarSign, Link as LinkIcon, User, Calendar, FileText, Paperclip, Activity, Clock } from 'lucide-react';
import { cn } from '../utils';
import { useTranslation } from '../i18n';
import Timeline from './Timeline';

export default function SidePanel({ appId, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('details');
  const { t } = useTranslation();
  const config = useConfig();

  const app = useLiveQuery(() => 
    appId ? db.applications.get(appId) : Promise.resolve(null),
  [appId]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
    }
  }, [isOpen, appId]);

  const updateAppField = async (field, value) => {
    if (!appId) return;
    await db.applications.update(appId, { [field]: value, lastUpdate: new Date().toISOString() });
  };

  const TABS = [
    { id: 'details', label: t('details'), icon: Activity },
    { id: 'timeline', label: t('timeline'), icon: Calendar },
    { id: 'description', label: t('description'), icon: FileText },
    { id: 'files', label: t('files'), icon: Paperclip },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="absolute inset-0 z-40 bg-zinc-900/10 dark:bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "absolute right-0 top-0 bottom-0 z-50 w-full md:w-[480px] bg-white dark:bg-[#0f0f12] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {app ? (() => {
          const currentStatusDef = config?.statuses?.find(s => s.id === app.status);
          
          return (
          <>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/80 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border", getStatusColors(currentStatusDef?.color))}>
                    {getDisplayName(currentStatusDef, t)}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{app.position}</h2>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mt-1">
                  <Building2 size={16} />
                  <span className="font-medium">{app.company}</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 pt-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-[1px] transition-colors",
                    activeTab === tab.id 
                      ? "border-indigo-500 text-indigo-500" 
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <div className={activeTab === 'details' ? 'space-y-6' : 'hidden'}>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    <Calendar size={14} /> {t('dateApplied')}
                  </label>
                  <input 
                    type="date" 
                    value={app.dateApplied ? app.dateApplied.split('T')[0] : ''} 
                    onChange={e => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value);
                        updateAppField('dateApplied', newDate.toISOString());
                      }
                    }}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors font-medium dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    <DollarSign size={14} /> {t('salaryExp')}
                  </label>
                  <input 
                    type="text" 
                    value={app.salary || ''} 
                    onChange={e => updateAppField('salary', e.target.value)}
                    placeholder={t('salaryPlaceholder')}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    <Clock size={14} /> {t('hoursPerWeek')}
                  </label>
                  <input 
                    type="text" 
                    value={app.hoursPerWeek || ''} 
                    onChange={e => updateAppField('hoursPerWeek', e.target.value)}
                    placeholder={t('hoursPlaceholder')}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    <LinkIcon size={14} /> {t('urlExp')}
                  </label>
                  <input 
                    type="url" 
                    value={app.url || ''} 
                    onChange={e => updateAppField('url', e.target.value)}
                    placeholder="https://..."
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    <User size={14} /> {t('contactPerson')}
                  </label>
                  <input 
                    type="text" 
                    value={app.contact || ''} 
                    onChange={e => updateAppField('contact', e.target.value)}
                    placeholder={t('contactPlaceholder')}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors font-medium"
                  />
                </div>
              </div>

              <div className={activeTab === 'timeline' ? 'h-full' : 'hidden'}>
                <Timeline appId={appId} currentStatus={app.status} />
              </div>

              <div className={activeTab === 'description' ? 'h-full flex flex-col' : 'hidden'}>
                <textarea 
                  value={app.description || ''} 
                  onChange={e => updateAppField('description', e.target.value)}
                  placeholder={t('descriptionPlaceholder')}
                  className="flex-1 w-full p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm leading-relaxed outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                />
              </div>

              <div className={activeTab === 'files' ? 'block' : 'hidden'}>
                <FilesTab appId={appId} t={t} />
              </div>
            </div>
          </>
        )})() : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 font-medium">
            {t('noAppSelected')}
          </div>
        )}
      </div>
    </>
  );
}

function FilesTab({ appId, t }) {
  const files = useLiveQuery(() => db.files.where('appId').equals(appId).toArray(), [appId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    await db.files.add({
      appId,
      fileName: file.name,
      fileBlob: file 
    });
    e.target.value = ''; 
  };

  const downloadFile = (fileObj) => {
    const url = URL.createObjectURL(fileObj.fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileObj.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteFile = async (id) => {
    await db.files.delete(id);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700/80 rounded-xl p-8 text-center bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors relative cursor-pointer group">
        <input 
          type="file" 
          onChange={handleFileUpload} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          accept=".pdf,.doc,.docx"
        />
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <Paperclip size={24} className="text-zinc-400 group-hover:text-indigo-500 transition-colors mb-2" />
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{t('dropFiles')}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 font-medium">{t('fileLimit')}</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 text-center px-4">{t('fileHint')}</p>
        </div>
      </div>

      <div className="space-y-2 mt-6">
        {files?.length === 0 && (
          <p className="text-center text-sm font-medium text-zinc-500 py-4">{t('noFiles')}</p>
        )}
        {files?.map(f => (
          <div key={f.id} className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-red-500/10 text-red-500 rounded-md">
                <FileText size={16} />
              </div>
              <span className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">{f.fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadFile(f)} className="p-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700/50 rounded-md transition-colors">
                {t('download')}
              </button>
              <button onClick={() => deleteFile(f.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
