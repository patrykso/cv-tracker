import { useState, useEffect, createContext, useContext } from 'react';

const en = {
  navApp: 'Applications',
  navStats: 'Statistics',
  navSettings: 'Settings',
  lightMode: 'Light Mode',
  darkMode: 'Dark Mode',
  privacyNotice: 'All data is stored locally in your browser. Nothing is sent to any servers.',
  freeAndPrivate: '100% free and private',
  titleApplications: 'Applications',
  searchPlaceholder: 'Search applications...',
  newApp: 'New Application',
  colCompany: 'Company',
  colPosition: 'Position',
  colStatus: 'Status',
  colApplied: 'Applied',
  colActivity: 'Last Activity',
  noApps: 'No applications found. Add your first space voyage!',
  
  companyLabel: 'Company',
  companyPlaceholder: 'e.g. Amazon',
  positionLabel: 'Position',
  positionPlaceholder: 'e.g. Graduate Software Engineer',
  statusLabel: 'Status',
  cancel: 'Cancel',
  create: 'Create',
  
  Applied: 'Applied',
  Interview: 'Interview',
  Offer: 'Offer',
  Rejected: 'Rejected',
  Ghosted: 'Ghosted',
  Dropped: 'Dropped',
  GenericNote: 'Note',
  
  details: 'Details',
  timeline: 'Timeline',
  description: 'Description',
  files: 'Files',
  salaryExp: 'Salary Expectations',
  salaryPlaceholder: 'e.g. $120k / yr or 40 USD / hr',
  urlExp: 'Job Posting URL',
  contactPerson: 'Contact Person',
  contactPlaceholder: 'e.g. Recruiter Name / Email',
  hoursPerWeek: 'Hours per week',
  hoursPlaceholder: 'e.g. 40',
  dateApplied: 'Date Applied',
  descriptionPlaceholder: 'Paste full job description here...',
  noAppSelected: 'Select an application to view details',
  
  dropFiles: 'Choose a file or drag & drop it here',
  fileLimit: 'PDF, DOC up to 5MB',
  fileHint: 'For example, your sent CV or a screenshot of the job offer.',
  noFiles: 'No files uploaded yet.',
  download: 'Download',
  
  noEvents: 'No events logged yet.',
  addNote: 'Stand-alone note / Event...',
  logActivity: 'Log Activity',
  initialApplication: 'Application tracked.',
  
  settings: 'Settings',
  dataMgmt: 'Data management',
  dataMgmtDesc: 'Export or import your CV Tracker database',
  exportBtn: 'Export to JSON',
  exportDesc: 'Create a full backup of all data',
  importBtn: 'Import from JSON',
  importDesc: 'Restore data from a backup file',
  
  statusConfig: 'Status configuration',
  statusConfigDesc: 'Manage statuses and setting of "Ghosted" status',
  customStatuses: 'Active Statuses',
  addStatus: 'Add New Status',
  resetStatuses: 'Reset Defaults',
  ghostedIntervalText: 'Auto-Ghost after (days)',
  
  dangerZone: 'Danger zone',
  dangerDesc: 'Irreversible destructive actions',
  nukeTitle: 'Nuke all database entries',
  nukeWarning: 'This will permanently delete all applications, timelines, and uploaded files. You cannot undo this action without a backup.',
  deleteBtn: 'Delete All Data',
  nukeConfirm: 'Are you sure? This will DELETE all your local applications, stages, and files. This action CANNOT be undone.',
  exportSuccess: 'Data exported successfully!',
  exportError: 'Failed to export data',
  importSuccess: 'Data imported successfully! The dashboard is updated.',
  importError: 'Failed to import data:',
  nukeSuccess: 'All data has been permanently deleted.',
  
  statsTitle: 'Analytics',
  statsDesc: 'General overview and metrics',
  statsFormatVertical: 'Vertical',
  statsFormatSquare: 'Square',
  statsFormatBanner: 'Banner',
  statsExportBtn: 'Download Image',
  statsTotal: 'Total Sent',
  statsInterviews: 'Interviews',
  statsOffers: 'Offers',
  statsNoData: 'Not enough data',
  statsInProgress: 'In Progress',
  statsActivity: 'Activity: Last 14 Days',
  statsExportTitle: 'Share your progress',
  statsRejectedTitle: 'Rejected',
  statsGhostedTitle: 'Ghosted',
  statsRateAllStr: 'of all applications',

  color_blue: 'Blue',
  color_emerald: 'Emerald',
  color_indigo: 'Indigo',
  color_orange: 'Orange',
  color_purple: 'Purple',
  color_red: 'Red',
  color_yellow: 'Yellow',
  color_zinc: 'Zinc',
};

const pl = {
  navApp: 'Aplikacje',
  navStats: 'Statystyki',
  navSettings: 'Ustawienia',
  lightMode: 'Jasny Motyw',
  darkMode: 'Ciemny Motyw',
  privacyNotice: 'Twoje dane są zapisywane tylko w Twojej przeglądarce i nie są nigdzie wysyłane.',
  freeAndPrivate: '100% darmowe i prywatne',
  titleApplications: 'Aplikacje',
  searchPlaceholder: 'Szukaj aplikacji...',
  newApp: 'Nowa Aplikacja',
  colCompany: 'Firma',
  colPosition: 'Stanowisko',
  colStatus: 'Status',
  colApplied: 'Data Dodania',
  colActivity: 'Ostatnia Aktywność',
  noApps: 'Brak aplikacji. Czas dodać pierwsze zgłoszenie!',
  
  companyLabel: 'Firma',
  companyPlaceholder: 'np. Amazon',
  positionLabel: 'Stanowisko',
  positionPlaceholder: 'np. Graduate Software Engineer',
  statusLabel: 'Początkowy Status',
  cancel: 'Anuluj',
  create: 'Utwórz',
  
  Applied: 'Wysłano CV',
  Interview: 'Rozmowa rekrutacyjna',
  Offer: 'Oferta',
  Rejected: 'Odrzucono',
  Ghosted: 'Zignorowano',
  Dropped: 'Zrezygnowano',
  GenericNote: 'Notatka',
  
  details: 'Szczegóły',
  timeline: 'Oś czasu',
  description: 'Opis',
  files: 'Pliki',
  salaryExp: 'Oczekiwania finansowe',
  salaryPlaceholder: 'np. 15k PLN / msc lub 40 PLN / hr',
  urlExp: 'Link do ogłoszenia',
  contactPerson: 'Osoba kontaktowa',
  contactPlaceholder: 'np. Jan Kowalski / HR@amazon.com',
  hoursPerWeek: 'Wymiar godzin',
  hoursPlaceholder: 'np. 40',
  dateApplied: 'Data wysłania',
  descriptionPlaceholder: 'Wklej tutaj pełny opis oferty pracy...',
  noAppSelected: 'Wybierz aplikację, aby zobaczyć szczegóły',
  
  dropFiles: 'Wybierz plik lub przeciągnij go tutaj',
  fileLimit: 'PDF, DOC do 5MB',
  fileHint: 'Na przykład wysłane CV czy zrzut ekranu oferty pracy.',
  noFiles: 'Brak wgranych plików.',
  download: 'Pobierz',
  
  noEvents: 'Brak zdarzeń.',
  addNote: 'Luźna notatka do zapisania...',
  logActivity: 'Zapisz Notatkę',
  initialApplication: 'Dodano zgłoszenie do CV Tracker.',
  
  settings: 'Ustawienia',
  dataMgmt: 'Zarządzanie danymi',
  dataMgmtDesc: 'Eksportuj lub importuj swoją bazę CV Tracker',
  exportBtn: 'Eksportuj do JSON',
  exportDesc: 'Utwórz pełną kopię zapasową danych',
  importBtn: 'Importuj z JSON',
  importDesc: 'Przywróć dane z pliku kopii zapasowej',
  
  statusConfig: 'Konfigurator statusów',
  statusConfigDesc: 'Zarządzaj statusami i mechanizmem automatycznego ustawiania statusu "Zignorowano"',
  customStatuses: 'Aktywne statusy',
  addStatus: 'Dodaj nowy status',
  resetStatuses: 'Przywróć domyślne',
  ghostedIntervalText: 'Okres przed ustawieniem statusu "zignorowano" (w dniach)',
  
  dangerZone: 'Strefa niebezpieczna',
  dangerDesc: 'Nieodwracalne akcje na bazie danych',
  nukeTitle: 'Wymaż wszystkie dane',
  nukeWarning: 'To trwale usunie wszystkie aplikacje, osie czasu i pliki. Operacja jest nieodwracalna bez dokonania kopii zapasowej.',
  deleteBtn: 'Usuń wszystkie dane',
  nukeConfirm: 'Na pewno? To usunie WSZYSTKIE rekordy, etapy i pliki. Tej akcji NIE MOŻNA cofnąć.',
  exportSuccess: 'Dane pomyślnie wyeksportowane!',
  exportError: 'Błąd podczas eksportu',
  importSuccess: 'Baza pomyślnie zaimportowana! Odświeżenie interfejsu.',
  importError: 'Błąd importu:',
  nukeSuccess: 'Całkowicie usunięto wszystkie dane z bazy.',
  
  statsTitle: 'Statystyki',
  statsDesc: 'Przegląd Twoich postępów',
  statsFormatVertical: 'Pionowy',
  statsFormatSquare: 'Kwadrat',
  statsFormatBanner: 'Szeroki baner',
  statsExportBtn: 'Pobierz obraz',
  statsTotal: 'Wysłane aplikacje',
  statsInterviews: 'Rozmowy rekrutacyjne',
  statsOffers: 'Oferty',
  statsNoData: 'Za mało danych',
  statsInProgress: 'Aplikacje w toku',
  statsActivity: 'Aktywność: Ostatnie 14 Dni',
  statsExportTitle: 'Podziel się swoim progresem',
  statsRejectedTitle: 'Odrzucono',
  statsGhostedTitle: 'Zignorowano',
  statsRateAllStr: 'wszystkich aplikacji',

  color_blue: 'Niebieski',
  color_emerald: 'Szmaragdowy',
  color_indigo: 'Indygo',
  color_orange: 'Pomarańczowy',
  color_purple: 'Fioletowy',
  color_red: 'Czerwony',
  color_yellow: 'Żółty',
  color_zinc: 'Cynkowy',
};

const translations = { en, pl };

export const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('pl');

  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved && (saved === 'en' || saved === 'pl')) {
      setLang(saved);
    }
  }, []);

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
