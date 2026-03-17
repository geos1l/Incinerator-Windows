import React from 'react';

export type FileFilter =
  | 'all'
  | 'images'
  | 'videos'
  | 'audio'
  | 'documents'
  | 'archives'
  | 'code'
  | 'apps'
  | 'duplicates';

export type SortMode = 'score' | 'recent' | 'size' | 'name';

interface FilterDef {
  id: FileFilter;
  label: string;
  icon: string;
}

const FILTERS: FilterDef[] = [
  { id: 'all',        label: 'All',       icon: '🔥' },
  { id: 'images',     label: 'Images',    icon: '🖼️' },
  { id: 'videos',     label: 'Videos',    icon: '🎬' },
  { id: 'audio',      label: 'Audio',     icon: '🎵' },
  { id: 'documents',  label: 'Docs',      icon: '📄' },
  { id: 'archives',   label: 'Archives',  icon: '📦' },
  { id: 'code',       label: 'Code',      icon: '💻' },
  { id: 'apps',       label: 'Apps',      icon: '⚙️' },
  { id: 'duplicates', label: 'Duplicates', icon: '👯' },
];

export const FILTER_EXTENSIONS: Record<Exclude<FileFilter, 'all' | 'duplicates'>, string[]> = {
  images:    ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.tif'],
  videos:    ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv', '.m4v'],
  audio:     ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.wma', '.m4a'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xlsx', '.xls', '.csv', '.pptx', '.ppt'],
  archives:  ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
  code:      ['.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.scss', '.json', '.yaml', '.yml', '.xml', '.java', '.cpp', '.c', '.h', '.rs', '.go', '.rb', '.php', '.sh', '.bat', '.ps1'],
  apps:      ['.exe', '.msi', '.dll', '.app', '.dmg', '.deb', '.rpm'],
};

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: 'score',  label: 'Score' },
  { id: 'recent', label: 'Recent' },
  { id: 'size',   label: 'Size' },
  { id: 'name',   label: 'Name' },
];

interface FilterBarProps {
  activeFilter: FileFilter;
  onFilterChange: (filter: FileFilter) => void;
  counts: Record<FileFilter, number>;
  sortMode: SortMode;
  onSortChange: (sort: SortMode) => void;
  isScheduledTab: boolean;
}

export default function FilterBar({ activeFilter, onFilterChange, counts, sortMode, onSortChange, isScheduledTab }: FilterBarProps) {
  const sorts = isScheduledTab
    ? SORT_OPTIONS
    : SORT_OPTIONS.filter((s) => s.id !== 'recent');

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      flexShrink: 0,
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-base)',
      gap: 8,
    }}>
      <div style={{
        display: 'flex',
        gap: 6,
        flex: 1,
        overflowX: 'auto',
      }}>
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          const count = counts[f.id];
          const hasItems = f.id === 'all' || count > 0;

          return (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 16,
                border: isActive ? '1px solid var(--accent-fire)' : '1px solid var(--border-subtle)',
                background: isActive ? 'var(--accent-fire)' : 'transparent',
                color: isActive ? '#000' : hasItems ? 'var(--text-secondary)' : 'var(--text-secondary)',
                opacity: hasItems ? 1 : 0.35,
                fontFamily: "'Chakra Petch', sans-serif",
                fontWeight: 600,
                fontSize: 11,
                cursor: hasItems ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 12 }}>{f.icon}</span>
              {f.label}
              {f.id !== 'all' && count > 0 && (
                <span style={{
                  fontSize: 9,
                  fontFamily: "'JetBrains Mono', monospace",
                  opacity: isActive ? 0.7 : 0.5,
                  fontWeight: 500,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
        borderLeft: '1px solid var(--border-subtle)',
        paddingLeft: 8,
      }}>
        <span style={{
          fontSize: 9,
          fontFamily: "'Chakra Petch', sans-serif",
          color: 'var(--text-secondary)',
          opacity: 0.5,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>Sort</span>
        {sorts.map((s) => {
          const isActive = sortMode === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSortChange(s.id)}
              style={{
                padding: '3px 8px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: "'Chakra Petch', sans-serif",
                fontWeight: isActive ? 700 : 500,
                fontSize: 10,
                cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
