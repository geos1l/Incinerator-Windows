import React from 'react';
import { motion } from 'framer-motion';
import { FileRecord } from '../shared/types';

interface BurnOverlayProps {
  file: FileRecord;
  type: 'schedule' | 'incinerate';
  startRect: DOMRect | null;
  targetRect: DOMRect | null;
  onComplete: () => void;
}

export default function BurnOverlay({
  file,
  type,
  startRect,
  targetRect,
  onComplete,
}: BurnOverlayProps) {
  if (!startRect || !targetRect) return null;

  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;
  const targetX = targetRect.left + targetRect.width / 2 - startX;
  const targetY = targetRect.top + targetRect.height / 2 - startY;

  if (type === 'schedule') {
    return (
      <motion.div
        initial={{
          position: 'fixed',
          left: startRect.left,
          top: startRect.top,
          width: startRect.width,
          height: startRect.height,
          opacity: 1,
          scale: 1,
          zIndex: 9999,
        }}
        animate={{
          x: targetX,
          y: targetY,
          scale: 0.3,
          opacity: 0,
          filter: 'grayscale(100%) brightness(0.4)',
        }}
        transition={{ duration: 0.6, ease: 'easeIn' }}
        onAnimationComplete={onComplete}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 12,
            color: 'var(--text-primary)',
            padding: 8,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {file.name}
        </span>
      </motion.div>
    );
  }

  // Incinerate animation
  return (
    <motion.div
      initial={{
        position: 'fixed',
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height,
        opacity: 1,
        scale: 1,
        rotate: 0,
        zIndex: 9999,
      }}
      animate={{
        x: targetX,
        y: targetY,
        scale: 0,
        rotate: 15,
        opacity: 0,
        filter: 'brightness(3) saturate(2)',
      }}
      transition={{ duration: 0.4, ease: 'easeIn' }}
      onAnimationComplete={onComplete}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--accent-fire)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        boxShadow: '0 0 20px rgba(232,83,26,0.6)',
      }}
    >
      <span
        style={{
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 12,
          color: 'var(--text-primary)',
          padding: 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {file.name}
      </span>
    </motion.div>
  );
}
