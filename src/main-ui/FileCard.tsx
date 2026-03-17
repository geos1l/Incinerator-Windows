import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileRecord } from '../shared/types';

interface FileCardProps {
  file: FileRecord;
  index: number;
  onDragToFirepit: (file: FileRecord, rect: DOMRect) => void;
}

function scoreToColor(score: number): string {
  if (score < 30) return '#3a3a3a';
  if (score < 60) return '#f5a623';
  return `#e8531a`;
}

function formatSize(mb: number): string {
  if (mb < 0.01) return `${Math.round(mb * 1024)} KB`;
  if (mb < 1) return `${mb.toFixed(1)} MB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatRelativeDate(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

const FILE_ICONS: Record<string, string> = {
  '.pdf': '📄', '.doc': '📝', '.docx': '📝', '.txt': '📝',
  '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️', '.webp': '🖼️', '.svg': '🖼️',
  '.mp4': '🎬', '.mov': '🎬', '.avi': '🎬', '.mkv': '🎬', '.webm': '🎬',
  '.mp3': '🎵', '.wav': '🎵', '.flac': '🎵', '.ogg': '🎵',
  '.zip': '📦', '.rar': '📦', '.7z': '📦', '.tar': '📦', '.gz': '📦',
  '.exe': '⚙️', '.msi': '⚙️', '.dll': '⚙️',
  '.js': '💻', '.ts': '💻', '.py': '💻', '.html': '💻', '.css': '💻',
  '.xlsx': '📊', '.xls': '📊', '.csv': '📊',
  '.pptx': '📎', '.ppt': '📎',
};

function getFileIcon(ext: string): string {
  return FILE_ICONS[ext.toLowerCase()] || '📁';
}

export default function FileCard({ file, index, onDragToFirepit }: FileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      layout
      drag
      dragSnapToOrigin
      whileHover={{ y: -2, boxShadow: '0 0 12px rgba(232,83,26,0.4)' }}
      whileDrag={{ rotate: 3, scale: 1.05, zIndex: 50 }}
      onDragEnd={(_event, info) => {
        // Detect if dragged into the right panel (firepit zone)
        // The left panel is ~58% of the window, so if the card's
        // current position + offset lands past ~50% of window width,
        // consider it a drop on the firepit
        if (cardRef.current) {
          const cardRect = cardRef.current.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2 + info.offset.x;
          const windowMidpoint = window.innerWidth * 0.5;

          if (cardCenterX > windowMidpoint) {
            onDragToFirepit(file, cardRect);
          }
        }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      style={{
        position: 'relative',
        background: file.isScheduled ? 'var(--scheduled-tint)' : 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '12px 40px 12px 14px',
        cursor: 'grab',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {file.thumbnailDataUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${file.thumbnailDataUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            opacity: 0.08,
            borderRadius: 8,
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 18 }}>{getFileIcon(file.extension)}</span>
          <span
            style={{
              fontFamily: "'Chakra Petch', sans-serif",
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
            title={file.name}
          >
            {file.name.length > 28 ? file.name.substring(0, 25) + '...' : file.name}
          </span>
          {file.isScheduled && (
            <span
              style={{
                background: 'var(--accent-ember)',
                color: '#000',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.05em',
                flexShrink: 0,
              }}
            >
              SCHEDULED
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>{formatSize(file.sizeMB)}</span>
          <span>opened {formatRelativeDate(file.lastOpenedAt)}</span>
          <span>created {formatRelativeDate(file.createdAt)}</span>
        </div>
      </div>

      {/* Heat bar */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: scoreToColor(file.deletionScore),
          borderRadius: '0 8px 8px 0',
        }}
      />
    </motion.div>
  );
}
