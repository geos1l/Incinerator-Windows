import React from 'react';

interface TabBarProps {
  activeTab: 'all' | 'scheduled';
  onTabChange: (tab: 'all' | 'scheduled') => void;
  scheduledCount: number;
}

export default function TabBar({ activeTab, onTabChange, scheduledCount }: TabBarProps) {
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    background: 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--accent-fire)' : '2px solid transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontFamily: "'Chakra Petch', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase' as const,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  });

  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        paddingLeft: 16,
        flexShrink: 0,
      }}
    >
      <button style={tabStyle(activeTab === 'all')} onClick={() => onTabChange('all')}>
        All Files
      </button>
      <button style={tabStyle(activeTab === 'scheduled')} onClick={() => onTabChange('scheduled')}>
        Firepit
        {scheduledCount > 0 && (
          <span
            style={{
              background: 'var(--accent-ember)',
              color: '#000',
              borderRadius: 10,
              padding: '1px 8px',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
            }}
          >
            {scheduledCount}
          </span>
        )}
      </button>
    </div>
  );
}
