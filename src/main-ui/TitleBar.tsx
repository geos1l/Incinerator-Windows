import React from 'react';

export default function TitleBar() {
  return (
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        // @ts-expect-error Electron-specific CSS property
        '-webkit-app-region': 'drag',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Chakra Petch', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: '0.08em',
          color: 'var(--accent-fire)',
          textTransform: 'uppercase',
        }}
      >
        Incinerator
      </span>
      {/* @ts-expect-error Electron-specific CSS property */}
      <div style={{ display: 'flex', gap: 8, '-webkit-app-region': 'no-drag' }}>
        <button
          onClick={() => window.incinerator.windowMinimize()}
          style={{
            width: 28,
            height: 28,
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-fire)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          &#x2014;
        </button>
        <button
          onClick={() => window.incinerator.windowClose()}
          style={{
            width: 28,
            height: 28,
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            borderRadius: 4,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--text-danger)';
            e.currentTarget.style.color = 'var(--text-danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          &#x2715;
        </button>
      </div>
    </div>
  );
}
