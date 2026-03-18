import React, { useState, useEffect } from 'react';

interface DiskInfo {
  usedGB: number;
  freeGB: number;
  totalGB: number;
  drive: string;
}

function barColor(pct: number): string {
  if (pct < 0.6) return '#4ade80';
  if (pct < 0.8) return '#f5a623';
  if (pct < 0.9) return '#f97316';
  return '#ef4444';
}

function fmt(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

export default function DiskBar() {
  const [disk, setDisk] = useState<DiskInfo | null>(null);

  useEffect(() => {
    window.incinerator.getDiskUsage().then(setDisk);
    const iv = setInterval(() => {
      window.incinerator.getDiskUsage().then(setDisk);
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  if (!disk || disk.totalGB === 0) return null;

  const pct = disk.usedGB / disk.totalGB;
  const color = barColor(pct);

  return (
    <div style={{
      padding: '4px 16px 6px',
      flexShrink: 0,
      background: 'var(--bg-base)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {disk.drive} Storage
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--text-secondary)',
        }}>
          {fmt(disk.usedGB)} / {fmt(disk.totalGB)}
        </span>
      </div>

      <div style={{
        width: '100%',
        height: 12,
        borderRadius: 6,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          height: '100%',
          width: `${(pct * 100).toFixed(1)}%`,
          borderRadius: 7,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          transition: 'width 0.6s ease, background 0.4s ease',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 7,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
          }} />
        </div>

        <span style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          color: pct > 0.45 ? '#fff' : 'var(--text-primary)',
          textShadow: pct > 0.45 ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
          pointerEvents: 'none',
        }}>
          {fmt(disk.freeGB)} free
        </span>
      </div>
    </div>
  );
}
