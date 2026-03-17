import React, { useState, useEffect, useRef } from 'react';
import { FireState } from '../shared/types';

interface FireAnimationProps {
  state: FireState;
  size?: 'widget' | 'main';
}

const FRAME_INTERVAL = 120;
const FRAME_COUNT = 5;

function getFramePaths(dir: string, prefix: string): string[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) =>
    `assets/${dir}/${prefix}_${i + 1}.png`
  );
}

const FIREPIT_FRAMES: Record<FireState, string[]> = {
  ember: getFramePaths('firepit', 'ember'),
  low: getFramePaths('firepit', 'low'),
  medium: getFramePaths('firepit', 'medium'),
  high: getFramePaths('firepit', 'high'),
};

export default function FireAnimation({ state, size = 'widget' }: FireAnimationProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFrameIndex(0);

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FRAME_COUNT);
    }, FRAME_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  const dimension = size === 'widget' ? 100 : 300;
  const frames = FIREPIT_FRAMES[state];
  const currentFrame = frames[frameIndex];

  return (
    <img
      src={currentFrame}
      alt={`fire-${state}`}
      style={{
        width: dimension,
        height: dimension,
        imageRendering: 'pixelated',
        objectFit: 'contain',
      }}
    />
  );
}
