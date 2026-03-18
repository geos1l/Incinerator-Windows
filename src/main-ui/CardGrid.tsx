import React from 'react';
import { AnimatePresence } from 'framer-motion';
import FileCard from './FileCard';
import { FileRecord } from '../shared/types';

interface CardGridProps {
  files: FileRecord[];
  loading: boolean;
  onFileDrop: (file: FileRecord, cardRect: DOMRect) => void;
  onUnschedule?: (file: FileRecord) => void;
  duplicateIds?: Set<string>;
  activeTab: 'all' | 'scheduled';
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        width: 170,
        height: 240,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div style={{ padding: 10 }}>
        <div style={{ width: '70%', height: 12, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ width: '100%', height: 100, background: 'var(--bg-elevated)', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ width: '50%', height: 10, background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 6 }} />
        <div style={{ width: '80%', height: 10, background: 'var(--bg-elevated)', borderRadius: 4 }} />
      </div>
    </div>
  );
}

export default function CardGrid({ files, loading, onFileDrop, onUnschedule, duplicateIds, activeTab }: CardGridProps) {
  const gridViewportStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflow: 'auto',
    // Right side also includes scrollbar width, so keep right padding smaller
    // to visually match the left gutter.
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 2,
  };

  if (loading) {
    return (
      <div style={gridViewportStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (files.length === 0) {
    const message = activeTab === 'scheduled'
      ? 'Nothing in the firepit. Your pit is cold.'
      : 'Nothing worth burning.';

    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ fontSize: 36 }}>🪨</span>
        <span
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {message}
        </span>
      </div>
    );
  }

    return (
    <div style={gridViewportStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {files.map((file, index) => (
            <FileCard
              key={file.id}
              file={file}
              index={index}
              onDragToFirepit={onFileDrop}
              onUnschedule={onUnschedule}
              isDuplicate={duplicateIds?.has(file.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
