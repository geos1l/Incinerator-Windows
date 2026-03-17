import React, { useState, useEffect, useCallback } from 'react';
import FireAnimation from './FireAnimation';
import { FireState } from '../shared/types';

declare global {
  interface Window {
    incinerator: {
      widgetClicked: () => void;
      filesDropped: (paths: string[]) => void;
      getRecycleBinSize: () => Promise<number>;
      onFireStateUpdate: (cb: (state: string) => void) => void;
      getRecycleBin: () => Promise<any[]>;
      getAllFiles: () => Promise<any[]>;
      permanentDelete: (path: string) => Promise<any>;
      scheduleDelete: (path: string) => Promise<any>;
      windowMinimize: () => void;
      windowClose: () => void;
    };
  }
}

export default function Widget() {
  const [fireState, setFireState] = useState<FireState>('ember');
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    window.incinerator.onFireStateUpdate((state) => {
      setFireState(state as FireState);
    });
    // Fetch initial state
    window.incinerator.getRecycleBinSize().then((sizeMB) => {
      if (sizeMB === 0) setFireState('ember');
      else if (sizeMB < 500) setFireState('low');
      else if (sizeMB < 2000) setFireState('medium');
      else setFireState('high');
    });
  }, []);

  const handleClick = useCallback(() => {
    window.incinerator.widgetClicked();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        // Electron extends File with a `path` property
        const filePath = (files[i] as any).path as string;
        if (filePath) paths.push(filePath);
      }
      if (paths.length > 0) window.incinerator.filesDropped(paths);
    }
  }, []);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: 120,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: '50%',
        background: isDragOver
          ? 'radial-gradient(circle, rgba(232,83,26,0.3) 0%, transparent 70%)'
          : 'transparent',
        transition: 'background 0.2s',
        // @ts-expect-error Electron-specific CSS property
        '-webkit-app-region': 'no-drag',
      }}
    >
      <FireAnimation
        state={isDragOver ? 'high' : fireState}
        size="widget"
      />
    </div>
  );
}
