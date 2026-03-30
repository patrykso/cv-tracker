import { useState } from 'react';
import { db, useConfig, DEFAULT_STATUSES, getStatusColors, getDisplayName } from '../db';
import { Download, Upload, AlertTriangle, CheckCircle, Database, ServerCrash, Settings as SettingsIcon, Plus, Trash2, Code2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { cn } from '../utils';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { t, lang } = useTranslation();
  const config = useConfig();

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleUpdateConfig = async (newConfig) => {
    try {
      await db.settings.put(newConfig);
    } catch (err) {
      showMessage('Failed to save settings', 'error');
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const base64ToBlob = async (base64Data) => {
    const res = await fetch(base64Data);
    return res.blob();
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const applications = await db.applications.toArray();
      const stages = await db.stages.toArray();
      const filesRaw = await db.files.toArray();
      const settings = await db.settings.toArray();
      
      const files = await Promise.all(filesRaw.map(async f => {
        if (!f.fileBlob) return f;
        const base64 = await blobToBase64(f.fileBlob);
        return { ...f, fileBlob: base64 };
      }));

      const data = { applications, stages, files, settings, schemaVersion: 2, appVersion: '1.0' };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `cv-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showMessage(t('exportSuccess'));
    } catch (err) {
      console.error(err);
      showMessage(t('exportError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.applications || !data.stages) throw new Error('Invalid format');

      const filesInput = data.files ? await Promise.all(data.files.map(async f => {
        if (!f.fileBlob) return f;
        const blob = await base64ToBlob(f.fileBlob);
        return { ...f, fileBlob: blob };
      })) : [];
      
      const v = data.appVersion || 'old';
      console.log('Importing CV Tracker JSON. Version:', v);
      // In future patches, if data schema changes drastically:
      // if (v === 'old') { data.applications.forEach(app => ... ); }

      await db.transaction('rw', db.applications, db.stages, db.files, db.settings, async () => {
        await db.applications.clear();
        await db.stages.clear();
        await db.files.clear();
        if (data.settings) await db.settings.clear();

        await db.applications.bulkAdd(data.applications);
        await db.stages.bulkAdd(data.stages);
        if (filesInput.length) await db.files.bulkAdd(filesInput);
        if (data.settings) await db.settings.bulkAdd(data.settings);
      });

      showMessage(t('importSuccess'));
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      showMessage(t('importError') + ' ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNukeData = async () => {
    const confirmed = window.confirm(t('nukeConfirm'));
    if (confirmed) {
      try {
        setLoading(true);
        await db.applications.clear();
        await db.stages.clear();
        await db.files.clear();
        showMessage(t('nukeSuccess'), 'success');
      } catch (err) {
        showMessage('Failed to delete data', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const addStatus = () => {
    const newId = `Custom_${Date.now()}`;
    const updated = { 
      ...config, 
      statuses: [...config.statuses, { id: newId, label: t('addStatus'), color: 'zinc' }]
    };
    handleUpdateConfig(updated);
  };

  const updateStatus = (index, field, value) => {
    const newStatuses = [...config.statuses];
    newStatuses[index] = { ...newStatuses[index], [field]: value };
    handleUpdateConfig({ ...config, statuses: newStatuses });
  };

  const removeStatus = (id) => {
    const newStatuses = config.statuses.filter(s => s.id !== id);
    handleUpdateConfig({ ...config, statuses: newStatuses });
  };

  if (!config) return null;

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full max-w-4xl mx-auto flex flex-col min-h-full">
      <div className="mb-12">
        <h1 className="text-3xl font-bold font-sans">{t('settings')}</h1>
      </div>

      {message.text && (
        <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'error' 
            ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' 
            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
        }`}>
          {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      <div className="space-y-6 flex-1">
        
        {/* Status Configuration */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <SettingsIcon size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('statusConfig')}</h3>
              <p className="text-sm text-zinc-500">{t('statusConfigDesc')}</p>
            </div>
            <button 
              onClick={() => handleUpdateConfig({ ...config, statuses: DEFAULT_STATUSES, ghostedInterval: 14 })}
              className="px-4 py-2 text-xs font-bold text-zinc-600 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
            >
              {t('resetStatuses')}
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 w-48">{t('ghostedIntervalText')}</label>
              <input 
                type="number" 
                min="1" max="365"
                value={config.ghostedInterval || 14}
                onChange={e => handleUpdateConfig({ ...config, ghostedInterval: Number(e.target.value) })}
                className="w-24 p-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 mt-6">{t('customStatuses')}</h4>
              <div className="space-y-3">
                {config.statuses.map((st, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
                    <div className="flex-1 w-full flex items-center gap-3">
                      <input 
                        type="text" 
                        value={getDisplayName(st, t)}
                        onChange={e => updateStatus(idx, 'label', e.target.value)}
                        className="flex-1 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm font-bold outline-none focus:border-indigo-500"
                        placeholder="Status Name"
                      />
                      
                      <select 
                        value={st.color}
                        onChange={e => updateStatus(idx, 'color', e.target.value)}
                        className={cn(
                          "p-2 rounded-md text-xs font-bold outline-none border cursor-pointer", 
                          st.isDefault ? "w-[190px]" : "w-36",
                          getStatusColors(st.color)
                        )}
                      >
                        {['blue', 'emerald', 'indigo', 'orange', 'purple', 'red', 'yellow', 'zinc'].map(c => (
                          <option 
                             key={c} 
                             value={c}
                             className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-bold"
                          >
                            {t(`color_${c}`)}
                          </option>
                        ))}
                      </select>

                      {!st.isDefault && (
                        <button 
                          onClick={() => removeStatus(st.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={addStatus}
                className="mt-4 flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700/80 text-zinc-500 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all text-sm font-bold"
              >
                <Plus size={16} />
                {t('addStatus')}
              </button>
            </div>
          </div>
        </section>

        {/* Export / Import */}
        <section className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{t('dataMgmt')}</h3>
              <p className="text-sm text-zinc-500">{t('dataMgmtDesc')}</p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleExport}
              disabled={loading}
              className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-xl transition-all disabled:opacity-50"
            >
              <div className="p-2 bg-indigo-500 text-white rounded-lg"><Download size={18} /></div>
              <div className="text-left">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{t('exportBtn')}</div>
                <div className="text-xs text-zinc-500 mt-0.5 font-medium">{t('exportDesc')}</div>
              </div>
            </button>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                onChange={handleImport}
                disabled={loading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              />
              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-xl transition-all disabled:opacity-50 h-full">
                <div className="p-2 bg-emerald-500 text-white rounded-lg"><Upload size={18} /></div>
                <div className="text-left">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{t('importBtn')}</div>
                  <div className="text-xs text-zinc-500 mt-0.5 font-medium">{t('importDesc')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-zinc-900/40 border border-red-200 dark:border-red-900/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-red-100 dark:border-red-900/30 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <ServerCrash size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">{t('dangerZone')}</h3>
              <p className="text-sm text-red-500/80 font-medium">{t('dangerDesc')}</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{t('nukeTitle')}</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm font-medium">{t('nukeWarning')}</p>
              </div>
              <button 
                onClick={handleNukeData}
                disabled={loading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors whitespace-nowrap disabled:opacity-50 shadow-sm border border-red-700"
              >
                {t('deleteBtn')}
              </button>
            </div>
          </div>
        </section>

      </div>

      <div className="mt-12 text-center flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
        <a href="https://github.com/patrykso" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-zinc-500">
          <Code2 size={14} /> Created by @patrykso <span className="opacity-50 mx-2">•</span> CV Tracker v1.0
        </a>
      </div>
    </div>
  );
}
