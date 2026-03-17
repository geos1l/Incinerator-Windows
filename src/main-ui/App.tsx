import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TitleBar from './TitleBar';
import TabBar from './TabBar';
import FilterBar, { FileFilter, FILTER_EXTENSIONS, SortMode } from './FilterBar';
import DiskBar from './DiskBar';
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
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('score');

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

  const tabFiles = activeTab === 'scheduled'
    ? files.filter((f) => f.isScheduled)
    : files.filter((f) => !f.isScheduled);

  const duplicateSet = useMemo(() => {
    const normalize = (filename: string): string => {
      const dotIdx = filename.lastIndexOf('.');
      const base = dotIdx > 0 ? filename.substring(0, dotIdx) : filename;
      const ext = dotIdx > 0 ? filename.substring(dotIdx) : '';

      let clean = base
        .replace(/\s*\(\d+\)\s*$/, '')      // "file (1)" -> "file"
        .replace(/\s*-\s*Copy(\s*\(\d+\))?$/i, '') // "file - Copy" / "file - Copy (2)"
        .replace(/^Copy\s+of\s+/i, '')       // "Copy of file"
        .replace(/\s*copy\s*\d*$/i, '')       // "file copy" / "file copy 2"
        .trim();

      return (clean + ext).toLowerCase();
    };

    const nameMap = new Map<string, FileRecord[]>();
    for (const f of tabFiles) {
      const key = normalize(f.name);
      const group = nameMap.get(key);
      if (group) group.push(f);
      else nameMap.set(key, [f]);
    }
    const ids = new Set<string>();
    for (const group of nameMap.values()) {
      if (group.length > 1) {
        for (const f of group) ids.add(f.id);
      }
    }
    return ids;
  }, [tabFiles]);

  const filterCounts = useMemo(() => {
    const counts: Record<FileFilter, number> = {
      all: tabFiles.length,
      images: 0, videos: 0, audio: 0, documents: 0,
      archives: 0, code: 0, apps: 0, duplicates: duplicateSet.size,
    };
    for (const f of tabFiles) {
      const ext = f.extension.toLowerCase();
      for (const [cat, exts] of Object.entries(FILTER_EXTENSIONS)) {
        if (exts.includes(ext)) {
          counts[cat as FileFilter]++;
          break;
        }
      }
    }
    return counts;
  }, [tabFiles, duplicateSet]);

  const displayedFiles = useMemo(() => {
    let result: FileRecord[];
    if (activeFilter === 'all') result = [...tabFiles];
    else if (activeFilter === 'duplicates') result = tabFiles.filter((f) => duplicateSet.has(f.id));
    else {
      const exts = FILTER_EXTENSIONS[activeFilter];
      result = tabFiles.filter((f) => exts.includes(f.extension.toLowerCase()));
    }

    switch (sortMode) {
      case 'recent':
        result.sort((a, b) => (b.scheduledAt ?? b.lastOpenedAt) - (a.scheduledAt ?? a.lastOpenedAt));
        break;
      case 'size':
        result.sort((a, b) => b.sizeMB - a.sizeMB);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'score':
      default:
        result.sort((a, b) => b.deletionScore - a.deletionScore);
        break;
    }

    return result;
  }, [tabFiles, activeFilter, duplicateSet, sortMode]);

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

  const handleUnschedule = useCallback(async (file: FileRecord) => {
    try {
      await window.incinerator.restoreFile(file.name);
      loadFiles();
    } catch (err) {
      console.error('Failed to unschedule file:', err);
    }
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
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={filterCounts}
        sortMode={sortMode}
        onSortChange={setSortMode}
        isScheduledTab={activeTab === 'scheduled'}
      />
      <DiskBar />
      <Layout>
        <CardGrid
          files={displayedFiles}
          loading={loading}
          onFileDrop={handleFileDrop}
          onUnschedule={handleUnschedule}
          duplicateIds={duplicateSet}
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
