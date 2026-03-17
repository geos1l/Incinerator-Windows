import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileRecord } from '../shared/types';

interface FileCardProps {
  file: FileRecord;
  index: number;
  onDragToFirepit: (file: FileRecord, rect: DOMRect) => void;
  onUnschedule?: (file: FileRecord) => void;
  isDuplicate?: boolean;
}

function scoreToColor(score: number): string {
  if (score < 30) return '#3a3a3a';
  if (score < 60) return '#f5a623';
  return '#e8531a';
}

function formatSize(mb: number): string {
  if (mb < 0.01) return `${Math.round(mb * 1024)} KB`;
  if (mb < 1) return `${mb.toFixed(1)} MB`;
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
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

function getParentFolder(filePath: string): string {
  const sep = filePath.includes('/') ? '/' : '\\';
  const parts = filePath.split(sep);
  if (parts.length >= 2) return parts[parts.length - 2];
  return '';
}

export default function FileCard({ file, index, onDragToFirepit, onUnschedule, isDuplicate }: FileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={cardRef}
      layout
      drag
      dragSnapToOrigin
      whileHover={{ y: -3, boxShadow: `0 0 16px ${scoreToColor(file.deletionScore)}66` }}
      whileDrag={{ rotate: 3, scale: 1.05, zIndex: 50 }}
      onDragEnd={(_event, info) => {
        if (cardRef.current) {
          const cardRect = cardRef.current.getBoundingClientRect();
          const cardCenterX = cardRect.left + cardRect.width / 2 + info.offset.x;
          if (cardCenterX > window.innerWidth * 0.5) {
            onDragToFirepit(file, cardRect);
          }
        }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      style={{
        position: 'relative',
        width: 170,
        background: file.isScheduled ? 'var(--scheduled-tint)' : 'var(--bg-surface)',
        border: `2px solid ${file.isScheduled ? '#3d2a0a' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: 0,
        cursor: 'grab',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* === TOP BAR: Name + Size (HP style) === */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        minHeight: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>{getFileIcon(file.extension)}</span>
          <span style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }} title={file.name}>
            {file.name}
          </span>
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: scoreToColor(file.deletionScore),
          flexShrink: 0,
          marginLeft: 4,
        }}>
          {formatSize(file.sizeMB)}
        </span>
      </div>

      {/* === ART BOX: Large icon area (like the Pokemon illustration) === */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: 90,
        margin: '6px 8px',
        borderRadius: 6,
        background: 'var(--bg-base)',
        border: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: 44, opacity: 0.45 }}>{getFileIcon(file.extension)}</span>

        {file.isScheduled && (
          <div style={{
            position: 'absolute',
            top: 6,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
          }}>
            <span style={{
              background: 'var(--accent-ember)',
              color: '#000',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}>
              SCHEDULED
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnschedule?.(file);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 4,
                padding: '2px 5px',
                fontSize: 8,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                lineHeight: 1.2,
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'var(--text-danger)';
                (e.target as HTMLButtonElement).style.color = '#fff';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--text-danger)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'var(--bg-elevated)';
                (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
                (e.target as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
              }}
            >
              UNDO
            </button>
          </div>
        )}

        {file.daysUntilAutoDelete !== undefined && file.isScheduled && (
          <span style={{
            position: 'absolute',
            bottom: 4,
            right: 6,
            fontSize: 8,
            color: 'var(--text-danger)',
            fontFamily: "'JetBrains Mono', monospace",
            opacity: 0.8,
          }}>
            {file.daysUntilAutoDelete}d left
          </span>
        )}

        {isDuplicate && (
          <span
            title={file.path}
            style={{
              position: 'absolute',
              bottom: 4,
              left: 6,
              right: 6,
              fontSize: 8,
              color: 'var(--text-secondary)',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: 0.6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {getParentFolder(file.path)}/
          </span>
        )}
      </div>

      {/* === STATS: Three rows like Pokemon attack descriptions === */}
      <div style={{
        padding: '6px 10px 8px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9,
        color: 'var(--text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 8 }}>Opened</span>
          <span>{formatRelative(file.lastOpenedAt)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 8 }}>Created</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 4,
        }}>
          <span style={{ opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 8 }}>Score</span>
          <span style={{ color: scoreToColor(file.deletionScore), fontWeight: 700, fontSize: 11 }}>
            {file.deletionScore}
          </span>
        </div>
      </div>

      {/* Score bar along the bottom */}
      <div style={{
        height: 3,
        background: scoreToColor(file.deletionScore),
        borderRadius: '0 0 10px 10px',
      }} />
    </motion.div>
  );
}
