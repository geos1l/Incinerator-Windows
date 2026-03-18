import React, { useEffect, useMemo, useState } from 'react';
import { animate, motion } from 'framer-motion';
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
    const scheduleEmbers = (() => {
      const colors = ['#ffd27a', '#ffb44a', '#ff7a2f', '#e8531a', '#7a2a10'];
      const count = 10;
      return Array.from({ length: count }, (_v, i) => {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const radius = 6 + Math.random() * 14;
        const dx = Math.cos(angle) * radius + (Math.random() - 0.5) * 8;
        const dy = Math.sin(angle) * radius - (10 + Math.random() * 18);
        const size = 3 + Math.floor(Math.random() * 3);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = 0.25 + Math.random() * 0.15;
        return { key: `s-ember-${i}`, dx, dy, size, color, delay };
      });
    })();

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
          scale: [1, 1.02, 0.85, 0.4],
          opacity: [1, 1, 0.9, 0],
          rotate: [0, -2, 4, 8],
          filter: [
            'brightness(1.1) saturate(1.1)',
            'brightness(1.8) saturate(1.6)',
            'brightness(0.9) saturate(0.8)',
            'brightness(0.6) saturate(0.6)',
          ],
        }}
        transition={{ duration: 0.8, ease: 'easeIn' }}
        onAnimationComplete={onComplete}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-ember)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          boxShadow: '0 0 18px rgba(245,166,35,0.35)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '0%', opacity: 0.85 }}
          animate={{ height: ['0%', '35%', '70%', '100%'], opacity: [0.4, 0.75, 0.9, 0.95] }}
          transition={{ duration: 0.8, ease: 'easeIn' }}
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(40,14,8,0.65) 55%, rgba(0,0,0,0.9) 100%)',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />

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

        {scheduleEmbers.map((e) => (
          <motion.div
            key={e.key}
            initial={{
              position: 'absolute',
              left: startRect.width / 2,
              top: startRect.height / 2,
              width: e.size,
              height: e.size,
              opacity: 0,
            }}
            animate={{ x: e.dx, y: e.dy, opacity: [0, 1, 0], scale: [1, 1, 0.4] }}
            transition={{ duration: 0.55, delay: e.delay, ease: 'easeOut' }}
            style={{ background: e.color, imageRendering: 'pixelated', boxShadow: `0 0 12px ${e.color}88` }}
          />
        ))}
      </motion.div>
    );
  }

  // Incinerate animation
  const [stage, setStage] = useState<'burning' | 'embers'>('burning');

  const [burnProgress, setBurnProgress] = useState(0);
  useEffect(() => {
    if (stage !== 'burning') return;
    setBurnProgress(0);
    const controls = animate(0, 1, {
      duration: 0.95,
      ease: 'easeIn',
      delay: 0.08,
      onUpdate: (v) => setBurnProgress(v),
    });
    return () => controls.stop();
  }, [stage]);

  const PIX = 8;
  const pixelGrid = useMemo(() => {
    const colors = ['#ffd27a', '#ffb44a', '#ff7a2f', '#e8531a', '#7a2a10', '#2a120b'];
    const cols = Math.max(8, Math.floor(startRect.width / PIX));
    const rows = Math.max(10, Math.floor(startRect.height / PIX));
    const list: Array<{ key: string; x: number; y: number; t: number; jitter: number; color: string }> = [];

    for (let ry = 0; ry < rows; ry++) {
      for (let cx = 0; cx < cols; cx++) {
        const t = rows <= 1 ? 1 : ry / (rows - 1);
        const jitter = (Math.random() - 0.5) * 0.28; // -0.14..+0.14
        const hotBias = Math.min(1, Math.max(0, (t - 0.35) / 0.65));
        const idx = Math.floor((Math.random() * 0.6 + hotBias * 0.4) * (colors.length - 1));
        const color = colors[Math.max(0, Math.min(colors.length - 1, idx))];
        list.push({ key: `p-${cx}-${ry}`, x: cx * PIX, y: ry * PIX, t, jitter, color });
      }
    }

    return { cols, rows, list };
  }, [startRect.width, startRect.height]);

  const contentOpacity =
    burnProgress < 0.25 ? 1 :
    burnProgress < 0.55 ? Math.max(0, 1 - (burnProgress - 0.25) / 0.3) :
    0;

  const emberPixels = useMemo(() => {
    const colors = ['#ffd27a', '#ffb44a', '#ff7a2f', '#e8531a', '#7a2a10'];
    const count = 28;
    const cx = targetRect.left + targetRect.width / 2;
    const cy = targetRect.top + targetRect.height / 2;

    return Array.from({ length: count }, (_v, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const radius = 10 + Math.random() * 34;
      const dx = Math.cos(angle) * radius + (Math.random() - 0.5) * 16;
      const dy = Math.sin(angle) * radius - (22 + Math.random() * 44);
      const size = 4 + Math.floor(Math.random() * 4); // 4-7px
      const color = colors[Math.floor(Math.random() * colors.length)];
      const delay = Math.random() * 0.1;
      return { key: `ember-${i}`, cx, cy, dx, dy, size, color, delay };
    });
  }, [targetRect.left, targetRect.top, targetRect.width, targetRect.height]);

  return (
    <>
      {stage === 'burning' && (
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
            filter: 'brightness(1) saturate(1)',
          }}
          animate={{
            x: targetX,
            y: targetY,
            scale: [1, 1.03, 0.9, 0.2],
            rotate: [0, -4, 7, 12],
            opacity: [1, 1, 0.95, 0],
            filter: [
              'brightness(1.2) saturate(1.1)',
              'brightness(2.2) saturate(1.8)',
              'brightness(3.0) saturate(2.2)',
              'brightness(0.7) saturate(0.8)',
            ],
          }}
          transition={{ duration: 1.0, ease: 'easeIn' }}
          onAnimationComplete={() => setStage('embers')}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--accent-fire)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            boxShadow: '0 0 22px rgba(232,83,26,0.55)',
            overflow: 'hidden',
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
              opacity: contentOpacity,
            }}
          >
            {file.name}
          </span>

          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {pixelGrid.list.map((p) => {
              const threshold = (1 - p.t) + p.jitter;
              const t = burnProgress - threshold;
              let op = 0;
              if (t >= 0 && t < 0.06) op = 1;
              else if (t >= 0.06 && t < 0.26) op = Math.max(0, 1 - (t - 0.06) / 0.2);
              else op = 0;

              let sc = 1;
              if (t < 0.08) sc = 1;
              else if (t < 0.22) sc = 1 - (t - 0.08) / 0.14 * 0.55;
              else sc = 0.45;

              return (
                <div
                  key={p.key}
                  style={{
                    position: 'absolute',
                    left: p.x,
                    top: p.y,
                    width: PIX,
                    height: PIX,
                    background: p.color,
                    opacity: op,
                    transform: `scale(${sc})`,
                    imageRendering: 'pixelated',
                    boxShadow: `0 0 10px ${p.color}55`,
                    mixBlendMode: 'screen',
                    transformOrigin: 'center',
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {stage === 'embers' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000 }}
        >
          {emberPixels.map((e, idx) => (
            <motion.div
              key={e.key}
              initial={{
                position: 'fixed',
                left: e.cx,
                top: e.cy,
                width: e.size,
                height: e.size,
                opacity: 0,
                scale: 1,
              }}
              animate={{
                x: e.dx,
                y: e.dy,
                opacity: [0, 1, 0],
                scale: [1, 1, 0.4],
              }}
              transition={{
                duration: 0.95,
                delay: e.delay,
                ease: 'easeOut',
              }}
              style={{
                background: e.color,
                imageRendering: 'pixelated',
                boxShadow: `0 0 16px ${e.color}aa`,
              }}
              onAnimationComplete={idx === emberPixels.length - 1 ? onComplete : undefined}
            />
          ))}
        </motion.div>
      )}
    </>
  );
}
