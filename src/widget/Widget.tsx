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
      restoreFile: (fileName: string) => Promise<any>;
      getDiskUsage: () => Promise<{ usedGB: number; freeGB: number; totalGB: number; drive: string }>;
      widgetResize: (expanded: boolean) => void;
      widgetStartDrag: () => void;
      widgetStopDrag: () => Promise<boolean>;
      windowMinimize: () => void;
      windowClose: () => void;
    };
  }
}

export default function Widget() {
  const [fireState, setFireState] = useState<FireState>('ember');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    window.incinerator.onFireStateUpdate((state) => {
      setFireState(state as FireState);
    });
    window.incinerator.getRecycleBinSize().then((sizeMB) => {
      if (sizeMB === 0) setFireState('ember');
      else if (sizeMB < 500) setFireState('low');
      else if (sizeMB < 2000) setFireState('medium');
      else setFireState('high');
    });
  }, []);

  useEffect(() => {
    const handleMouseUp = async () => {
      if (!isDragging) return;
      setIsDragging(false);
      const wasDrag = await window.incinerator.widgetStopDrag();
      if (!wasDrag) {
        window.incinerator.widgetClicked();
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    window.incinerator.widgetStartDrag();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) {
      setIsDragOver(true);
      window.incinerator.widgetResize(true);
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    window.incinerator.widgetResize(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    window.incinerator.widgetResize(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const filePath = (files[i] as any).path as string;
        if (filePath) paths.push(filePath);
      }
      if (paths.length > 0) window.incinerator.filesDropped(paths);
    }
  }, []);

  const opacity = isDragOver ? 1 : isHovered ? 0.8 : 0.25;

  return (
    <div
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragStart={(e) => e.preventDefault()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: '50%',
        opacity,
        background: isDragOver
          ? 'radial-gradient(circle, rgba(232,83,26,0.4) 0%, transparent 70%)'
          : 'transparent',
        transition: 'opacity 0.25s ease, background 0.25s ease',
        userSelect: 'none',
      }}
    >
      <FireAnimation
        state={isDragOver ? 'high' : fireState}
        size={isDragOver ? 'widget' : 'mini'}
      />
    </div>
  );
}
