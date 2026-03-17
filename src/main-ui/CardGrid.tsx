import React from 'react';
import { AnimatePresence } from 'framer-motion';
import FileCard from './FileCard';
import { FileRecord } from '../shared/types';

interface CardGridProps {
  files: FileRecord[];
  loading: boolean;
  onFileDrop: (file: FileRecord, cardRect: DOMRect) => void;
  activeTab: 'all' | 'scheduled';
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '12px 14px',
        height: 68,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    >
      <div
        style={{
          width: '60%',
          height: 14,
          background: 'var(--bg-elevated)',
          borderRadius: 4,
          marginBottom: 10,
        }}
      />
      <div
        style={{
          width: '40%',
          height: 10,
          background: 'var(--bg-elevated)',
          borderRadius: 4,
        }}
      />
    </div>
  );
}

export default function CardGrid({ files, loading, onFileDrop, activeTab }: CardGridProps) {
  if (loading) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      ? 'Nothing scheduled. Your pit is cold.'
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
    <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence mode="popLayout">
          {files.map((file, index) => (
            <FileCard
              key={file.id}
              file={file}
              index={index}
              onDragToFirepit={onFileDrop}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
