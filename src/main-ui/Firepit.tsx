import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import FireAnimation from '../widget/FireAnimation';
import { FireState } from '../shared/types';

interface FirepitProps {
  fireState: FireState;
  onRectUpdate: (rect: DOMRect) => void;
}

export default function Firepit({ fireState, onRectUpdate }: FirepitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      onRectUpdate(containerRef.current.getBoundingClientRect());
    }
    const handleResize = () => {
      if (containerRef.current) {
        onRectUpdate(containerRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onRectUpdate]);

  return (
    <motion.div
      ref={containerRef}
      animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Glow behind fire */}
        <div
          style={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(232,83,26,${isHovered ? 0.2 : 0.1}) 0%, transparent 70%)`,
            transition: 'all 0.3s',
          }}
        />
        <FireAnimation
          state={isHovered ? 'high' : fireState}
          size="main"
        />
      </div>

      <p
        style={{
          fontFamily: "'Chakra Petch', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: isHovered ? 'var(--accent-fire)' : 'var(--text-secondary)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
      >
        {isHovered ? 'Release to incinerate' : 'Drag files here'}
      </p>

      <p
        style={{
          fontSize: 10,
          color: 'var(--text-secondary)',
          fontFamily: "'JetBrains Mono', monospace",
          opacity: 0.6,
        }}
      >
        Drag cards from the left panel →
      </p>
    </motion.div>
  );
}
