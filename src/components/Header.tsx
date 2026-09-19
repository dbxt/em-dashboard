import { Theme } from '../state/storage';

interface Props {
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export function Header({ theme, onToggleTheme, onOpenSettings }: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="var(--brand-tile)" />
          <rect x="6" y="16" width="4" height="10" rx="1" fill="var(--green)" />
          <rect x="14" y="10" width="4" height="16" rx="1" fill="var(--amber)" />
          <rect x="22" y="6" width="4" height="20" rx="1" fill="var(--red)" />
        </svg>
        <span>Sprint Ledger</span>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-ghost" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" fill="currentColor" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M13 3l-1.4 1.4M4.4 11.6L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.6A6 6 0 116.4 2.5a5 5 0 007.1 7.1z" fill="currentColor" /></svg>
          )}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button className="btn" onClick={onOpenSettings} aria-label="Open settings">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h7M12 4h2M2 12h2M7 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="10.5" cy="4" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="5.5" cy="12" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
