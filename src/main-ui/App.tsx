import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './TitleBar';
import TabBar from './TabBar';
import Layout from './Layout';
import CardGrid from './CardGrid';
import Firepit from './Firepit';
import BurnOverlay from './BurnOverlay';
import { FileRecord, FireState } from '../shared/types';

type Tab = 'all' | 'scheduled';

interface BurnAnimation {
  file: FileRecord;
  type: 'schedule' | 'incinerate';
  startRect: DOMRect | null;
}

export default function App() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [fireState, setFireState] = useState<FireState>('ember');
  const [loading, setLoading] = useState(true);
  const [burnAnim, setBurnAnim] = useState<BurnAnimation | null>(null);
  const [firepitRect, setFirepitRect] = useState<DOMRect | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const allFiles = await window.incinerator.getAllFiles();
      setFiles(allFiles);
    } catch (err) {
      console.error('Failed to load files:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFiles();
    window.incinerator.onFireStateUpdate((state) => {
      setFireState(state as FireState);
    });
    window.incinerator.getRecycleBinSize().then((sizeMB) => {
      if (sizeMB === 0) setFireState('ember');
      else if (sizeMB < 500) setFireState('low');
      else if (sizeMB < 2000) setFireState('medium');
      else setFireState('high');
    });
  }, [loadFiles]);

  const scheduledCount = files.filter((f) => f.isScheduled).length;

  const displayedFiles = activeTab === 'scheduled'
    ? files.filter((f) => f.isScheduled)
    : files.filter((f) => !f.isScheduled);

  const handleFileDrop = useCallback(async (file: FileRecord, cardRect: DOMRect | null) => {
    const animType = file.isScheduled ? 'incinerate' : 'schedule';
    setBurnAnim({ file, type: animType, startRect: cardRect });

    try {
      if (file.isScheduled) {
        await window.incinerator.permanentDelete(file.path);
      } else {
        await window.incinerator.scheduleDelete(file.path);
      }
    } catch (err) {
      console.error('Delete operation failed:', err);
    }

    setTimeout(() => {
      setBurnAnim(null);
      loadFiles();
    }, animType === 'incinerate' ? 500 : 700);
  }, [loadFiles]);

  const handleBurnComplete = useCallback(() => {
    setBurnAnim(null);
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      <TitleBar />
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scheduledCount={scheduledCount}
      />
      <Layout>
        <CardGrid
          files={displayedFiles}
          loading={loading}
          onFileDrop={handleFileDrop}
          activeTab={activeTab}
        />
        <Firepit
          fireState={fireState}
          onRectUpdate={setFirepitRect}
        />
      </Layout>
      {burnAnim && (
        <BurnOverlay
          file={burnAnim.file}
          type={burnAnim.type}
          startRect={burnAnim.startRect}
          targetRect={firepitRect}
          onComplete={handleBurnComplete}
        />
      )}
    </div>
  );
}
