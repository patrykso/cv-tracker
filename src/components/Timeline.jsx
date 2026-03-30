import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, useConfig, getStatusColors, getDisplayName } from '../db';
import { format } from 'date-fns';
import { MessageSquare, Send, CheckCircle2, PhoneCall, Code2, Users, FileCheck, XCircle, Ghost } from 'lucide-react';
import { cn } from '../utils';
import { useTranslation } from '../i18n';

// Local icon map for visual flair
export const ICONS_MAP = {
  Send: Send,
  MessagesSquare: MessageSquare,
  PhoneCall: PhoneCall,
  Code2: Code2,
  Users: Users,
  FileCheck: FileCheck,
  XCircle: XCircle,
  Ghost: Ghost,
};

export default function Timeline({ appId, currentStatus }) {
  const [newStage, setNewStage] = useState('GenericNote');
  const [newNote, setNewNote] = useState('');
  const { t } = useTranslation();
  const config = useConfig();

  const stagesQuery = useLiveQuery(() => 
    db.stages.where('appId').equals(appId).sortBy('date')
  , [appId]);

  const stages = stagesQuery || [];

  const handleAddStage = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const date = new Date().toISOString();
    
    await db.stages.add({
      appId,
      type: newStage,
      date,
      notes: newNote
    });

    if (newStage !== 'GenericNote' && newStage !== currentStatus) {
      await db.applications.update(appId, {
        status: newStage,
        lastUpdate: date
      });
    } else {
      await db.applications.update(appId, {
        lastUpdate: date
      });
    }

    setNewNote('');
    setNewStage('GenericNote');
  };

  if (!config) return null;

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/10">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8 relative">
          {stages.length === 0 && (
            <p className="text-sm font-medium text-zinc-500 text-center py-8">{t('noEvents')}</p>
          )}

          {stages.map((stage, idx) => {
            const isLast = idx === stages.length - 1;
            const stageConfig = config.statuses.find(s => s.id === stage.type);
            const StageIcon = stageConfig?.icon && ICONS_MAP[stageConfig.icon] ? ICONS_MAP[stageConfig.icon] : CheckCircle2;
            const badgeColors = stage.type === 'GenericNote' 
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' 
              : getStatusColors(stageConfig?.color);

            return (
              <div key={stage.id} className="relative flex gap-4">
                {!isLast && (
                  <div className="absolute top-8 bottom-0 left-[15px] w-px bg-zinc-200 dark:bg-zinc-800 -mb-8"></div>
                )}
                
                <div className={cn("relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white dark:border-[#0f0f12]", badgeColors)}>
                  <StageIcon size={14} className="opacity-80" />
                </div>
                
                <div className="bg-white dark:bg-zinc-800/80 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/60 shadow-sm flex-1 mt-1 text-sm">
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <span className={cn("font-bold px-2.5 py-1 rounded-md text-[10px] tracking-wider uppercase border", badgeColors)}>
                      {stage.type === 'GenericNote' ? t('GenericNote') : getDisplayName(stageConfig, t)}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs tracking-wide font-mono font-medium shrink-0">
                      {format(new Date(stage.date), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  {stage.notes && (
                    <p className="text-zinc-700 dark:text-zinc-300 mt-2 font-medium leading-relaxed">{stage.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleAddStage} className="space-y-4">
          <div className="flex gap-3">
            <select 
              value={newStage} 
              onChange={e => setNewStage(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-indigo-500 font-bold max-w-[140px]"
            >
              <option value="GenericNote" className="font-bold text-zinc-500">{t('GenericNote')}</option>
              {config.statuses.map(st => (
                <option key={st.id} value={st.id}>{getDisplayName(st, t)}</option>
              ))}
            </select>
            <input 
              type="text" 
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder={t('addNote')}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500 font-medium placeholder:text-zinc-400"
            />
          </div>
          <button 
            type="submit" 
            disabled={!newNote.trim()}
            className="w-full p-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-indigo-600 disabled:border-zinc-200 dark:disabled:border-zinc-700 shadow-sm"
          >
            <MessageSquare size={16} />
            {t('logActivity')}
          </button>
        </form>
      </div>
    </div>
  );
}
