import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';

export const db = new Dexie('CVTrackerDB');

db.version(1).stores({
  applications: '++id, company, position, status, dateApplied, lastUpdate',
  stages: '++id, appId, type, date, notes',
  files: '++id, appId, fileName'
});

db.version(2).stores({
  applications: '++id, company, position, status, dateApplied, lastUpdate',
  stages: '++id, appId, type, date, notes',
  files: '++id, appId, fileName',
  settings: 'id'
}).upgrade(tx => {
});

export const DEFAULT_STATUSES = [
  { id: 'Applied', label: 'Applied', color: 'blue', isDefault: true },
  { id: 'Interview', label: 'Interview', color: 'indigo', isDefault: true },
  { id: 'Offer', label: 'Offer', color: 'emerald', isDefault: true },
  { id: 'Rejected', label: 'Rejected', color: 'red', isDefault: true },
  { id: 'Ghosted', label: 'Ghosted', color: 'zinc', isDefault: true },
  { id: 'Dropped', label: 'Dropped', color: 'orange', isDefault: true }
];

export const getDisplayName = (st, t) => {
  if (!st) return '';
  if (st.isDefault && st.label === st.id) {
    return t(st.id);
  }
  return st.label;
};

export const getStatusColors = (colorName) => {
  const map = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-zinc-800/80 dark:text-blue-300 dark:border-zinc-700',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-zinc-800/80 dark:text-yellow-400 dark:border-zinc-700',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-zinc-800/80 dark:text-emerald-400 dark:border-zinc-700',
    red: 'bg-red-100 text-red-700 border-red-200 dark:bg-zinc-800/80 dark:text-red-400 dark:border-zinc-700',
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700',
    orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-zinc-800/80 dark:text-orange-400 dark:border-zinc-700',
    purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-zinc-800/80 dark:text-purple-400 dark:border-zinc-700',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-zinc-800/80 dark:text-indigo-400 dark:border-zinc-700',
  };
  return map[colorName] || map.zinc;
};

export function useConfig() {
  return useLiveQuery(async () => {
    let config = await db.settings.get('global');
    if (!config || !config.statuses || !Array.isArray(config.statuses)) {
      config = {
        id: 'global',
        statuses: DEFAULT_STATUSES,
        ghostedInterval: 14,
        ...config // merge if partially exists
      };
      if (!config.statuses || !Array.isArray(config.statuses)) {
         config.statuses = DEFAULT_STATUSES;
      }
      // Removed db.settings.put(config) since useLiveQuery creates a strictly read-only transaction.
    }
    return config;
  }, []);
}
