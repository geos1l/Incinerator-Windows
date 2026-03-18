import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TitleBar from './TitleBar';
import RoastPanel, { SpaceStats } from './RoastPanel';
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
  const [baseFiles, setBaseFiles] = useState<FileRecord[]>([]);
  const [deepFiles, setDeepFiles] = useState<FileRecord[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [fireState, setFireState] = useState<FireState>('ember');
  const [loading, setLoading] = useState(true);
  const [roastSeed, setRoastSeed] = useState(0);
  const [burnAnim, setBurnAnim] = useState<BurnAnimation | null>(null);
  const [firepitRect, setFirepitRect] = useState<DOMRect | null>(null);
  const [activeFilter, setActiveFilter] = useState<FileFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('score');
  const [isFiltering, setIsFiltering] = useState(false);
  const [deepScanOpen, setDeepScanOpen] = useState(false);
  const [deepScanRoots, setDeepScanRoots] = useState<string[] | null>(null);
  const [deepScanMinSizeMB, setDeepScanMinSizeMB] = useState<number | null>(null);
  const [deepScanId, setDeepScanId] = useState<string | null>(null);
  const [deepScanProgress, setDeepScanProgress] = useState<{ scannedFiles: number; matchedFiles: number } | null>(null);
  const [deepScanRunning, setDeepScanRunning] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const allFiles = await window.incinerator.getAllFiles();
      setBaseFiles(allFiles);
    } catch (err) {
      console.error('Failed to load files:', err);
    }
    setLoading(false);
  }, []);

  const files = useMemo(() => {
    if (deepFiles.length === 0) return baseFiles;
    const byPath = new Map<string, FileRecord>();
    for (const f of baseFiles) byPath.set(f.path, f);
    for (const f of deepFiles) {
      if (!byPath.has(f.path)) byPath.set(f.path, f);
    }
    return Array.from(byPath.values());
  }, [baseFiles, deepFiles]);

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

  const fileById = useMemo(() => {
    const m = new Map<string, FileRecord>();
    for (const f of files) m.set(f.id, f);
    return m;
  }, [files]);

  useEffect(() => {
    // Keep the overlay up until changes stop for a moment.
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 800);
    return () => clearTimeout(t);
  }, [activeTab, activeFilter, sortMode, tabFiles.length]);

  const spaceStats: SpaceStats | null = useMemo(() => {
    if (files.length === 0) return null;
    let totalMB = 0;
    let videosMB = 0;
    let photosMB = 0;
    let appsMB = 0;
    let docsMB = 0;
    let archivesMB = 0;
    let audioMB = 0;
    let installersMB = 0;
    let installersCount = 0;
    let neverOpenedCount = 0;
    let scheduledCountAll = 0;
    let highScoreCount = 0;

    const imageExts = new Set(FILTER_EXTENSIONS.images);
    const videoExts = new Set(FILTER_EXTENSIONS.videos);
    const audioExts = new Set(FILTER_EXTENSIONS.audio);
    const docsExts = new Set(FILTER_EXTENSIONS.documents);
    const archivesExts = new Set(FILTER_EXTENSIONS.archives);
    const codeExts = new Set(FILTER_EXTENSIONS.code);
    const appsExts = new Set(FILTER_EXTENSIONS.apps);

    const installerExts = new Set(['.exe', '.msi', '.app', '.dmg', '.pkg', '.deb', '.rpm']);

    for (const f of files) {
      totalMB += f.sizeMB;
      const ext = f.extension.toLowerCase();
      if (videoExts.has(ext)) videosMB += f.sizeMB;
      else if (imageExts.has(ext)) photosMB += f.sizeMB;
      else if (appsExts.has(ext)) appsMB += f.sizeMB;
      else if (docsExts.has(ext)) docsMB += f.sizeMB;
      else if (archivesExts.has(ext)) archivesMB += f.sizeMB;
      else if (audioExts.has(ext)) audioMB += f.sizeMB;

      if (installerExts.has(ext) || /setup|installer|install/i.test(f.name)) {
        installersMB += f.sizeMB;
        installersCount += 1;
      }

      if (f.isScheduled) scheduledCountAll += 1;
      if (f.deletionScore >= 85) highScoreCount += 1;
      if (Math.abs(f.lastOpenedAt - f.createdAt) < 60_000) {
        neverOpenedCount += 1;
      }
    }

    // Very simple duplicate estimate: reuse duplicateSet when on "all" tab, else ignore.
    const duplicatesCount =
      activeTab === 'all' ? duplicateSet.size : 0;

    const totalGB = totalMB / 1024;
    return {
      totalGB,
      fileCount: files.length,
      videosGB: videosMB / 1024,
      photosGB: photosMB / 1024,
      appsGB: appsMB / 1024,
      docsGB: docsMB / 1024,
      archivesGB: archivesMB / 1024,
      audioGB: audioMB / 1024,
      otherGB:
        totalGB -
        (videosMB + photosMB + appsMB + docsMB + archivesMB + audioMB) / 1024,
      installersGB: installersMB / 1024,
      installersCount,
      duplicatesCount,
      neverOpenedCount,
      scheduledCount: scheduledCountAll,
      highScoreCount,
    };
  }, [files, activeTab, duplicateSet]);

  const firepitStats: SpaceStats | null = useMemo(() => {
    const scheduled = files.filter((f) => f.isScheduled);
    if (scheduled.length === 0) return null;

    let totalMB = 0;
    let videosMB = 0;
    let photosMB = 0;
    let appsMB = 0;
    let docsMB = 0;
    let archivesMB = 0;
    let audioMB = 0;

    const imageExts = new Set(FILTER_EXTENSIONS.images);
    const videoExts = new Set(FILTER_EXTENSIONS.videos);
    const audioExts = new Set(FILTER_EXTENSIONS.audio);
    const docsExts = new Set(FILTER_EXTENSIONS.documents);
    const archivesExts = new Set(FILTER_EXTENSIONS.archives);
    const appsExts = new Set(FILTER_EXTENSIONS.apps);

    for (const f of scheduled) {
      totalMB += f.sizeMB;
      const ext = f.extension.toLowerCase();
      if (videoExts.has(ext)) videosMB += f.sizeMB;
      else if (imageExts.has(ext)) photosMB += f.sizeMB;
      else if (appsExts.has(ext)) appsMB += f.sizeMB;
      else if (docsExts.has(ext)) docsMB += f.sizeMB;
      else if (archivesExts.has(ext)) archivesMB += f.sizeMB;
      else if (audioExts.has(ext)) audioMB += f.sizeMB;
    }

    const totalGB = totalMB / 1024;
    return {
      totalGB,
      fileCount: scheduled.length,
      videosGB: videosMB / 1024,
      photosGB: photosMB / 1024,
      appsGB: appsMB / 1024,
      docsGB: docsMB / 1024,
      archivesGB: archivesMB / 1024,
      audioGB: audioMB / 1024,
      otherGB: totalGB - (videosMB + photosMB + appsMB + docsMB + archivesMB + audioMB) / 1024,
      installersGB: 0,
      installersCount: 0,
      duplicatesCount: 0,
      neverOpenedCount: 0,
      scheduledCount: scheduled.length,
      highScoreCount: 0,
    };
  }, [files]);

  const handleFilesDrop = useCallback(async (idsToDrop: string[], cardRect: DOMRect) => {
    const groupFiles = idsToDrop
      .map((id) => fileById.get(id))
      .filter((f): f is FileRecord => !!f);

    if (groupFiles.length === 0) return;

    const primaryFile = groupFiles[0];
    const animType = primaryFile.isScheduled ? 'incinerate' : 'schedule';
    setBurnAnim({ file: primaryFile, type: animType, startRect: cardRect });

    const scheduledPathsSet = new Set<string>();
    try {
      await Promise.all(
        groupFiles.map(async (f) => {
          if (f.isScheduled) {
            await window.incinerator.permanentDelete(f.path);
          } else {
            scheduledPathsSet.add(f.path);
            await window.incinerator.scheduleDelete(f.path);
          }
        })
      );
    } catch (err) {
      console.error('Delete operation failed:', err);
    }

    if (scheduledPathsSet.size > 0) {
      setDeepFiles((prev) => prev.filter((f) => !scheduledPathsSet.has(f.path)));
    }

    // Clear selection after group action.
    setSelectedIds(new Set());
    setSelectMode(false);

    setTimeout(() => {
      setBurnAnim(null);
      loadFiles();
    }, animType === 'incinerate' ? 500 : 700);
  }, [fileById, loadFiles]);

  const handleUnschedule = useCallback(async (file: FileRecord) => {
    try {
      await window.incinerator.restoreFile(file.name);
      loadFiles();
    } catch (err) {
      console.error('Failed to unschedule file:', err);
    }
  }, [loadFiles]);

  useEffect(() => {
    // Listen for deep scan batches from main process
    window.incinerator.onDeepScanBatch?.((payload: any) => {
      if (!payload || !payload.scanId) return;
      if (payload.progress) setDeepScanProgress(payload.progress);
      if (payload.done) {
        setDeepScanRunning(false);
        return;
      }
      if (payload.batch && Array.isArray(payload.batch)) {
        setDeepFiles((prev) => {
          const byPath = new Map<string, FileRecord>();
          for (const f of prev) byPath.set(f.path, f);
          for (const f of payload.batch as FileRecord[]) {
            if (!byPath.has(f.path)) byPath.set(f.path, f);
          }
          return Array.from(byPath.values());
        });
      }
    });
  }, []);

  const ensureDefaultDeepRoots = useCallback(() => {
    if (deepScanRoots && deepScanRoots.length > 0) return deepScanRoots;
    const userProfile = (window as any).process?.env?.USERPROFILE as string | undefined;
    // Fallback: mimic the quick scan set via common folder names under user profile.
    if (userProfile) {
      return ['Desktop', 'Downloads', 'Documents', 'Pictures', 'Videos'].map((d) => `${userProfile}\\\\${d}`);
    }
    return [];
  }, [deepScanRoots]);

  const startDeepScan = useCallback(async () => {
    const roots = ensureDefaultDeepRoots();
    if (roots.length === 0) return;
    setDeepScanRunning(true);
    setDeepScanProgress({ scannedFiles: 0, matchedFiles: 0 });
    const res = await window.incinerator.deepScanStart({ roots, minSizeMB: deepScanMinSizeMB });
    setDeepScanId(res?.scanId ?? null);
    setDeepScanOpen(false);
  }, [deepScanMinSizeMB, ensureDefaultDeepRoots]);

  const cancelDeepScan = useCallback(async () => {
    if (!deepScanId) return;
    await window.incinerator.deepScanCancel(deepScanId);
    setDeepScanRunning(false);
  }, [deepScanId]);

  const revealInFolder = useCallback(async (file: FileRecord) => {
    try {
      await window.incinerator.revealInFolder(file.path);
    } catch (err) {
      console.error('Failed to reveal file in folder:', err);
    }
  }, []);

  const pickMoreFolders = useCallback(async () => {
    const picked: string[] = await window.incinerator.pickScanFolders();
    if (!picked || picked.length === 0) return;
    setDeepScanRoots((prev) => {
      const base = prev && prev.length ? prev : ensureDefaultDeepRoots();
      const set = new Set<string>(base);
      for (const p of picked) set.add(p);
      return Array.from(set);
    });
  }, [ensureDefaultDeepRoots]);

  const handleBurnComplete = useCallback(() => {
    setBurnAnim(null);
  }, []);

  const handleRoastAgain = useCallback(() => {
    setRoastSeed((prev) => prev + 1);
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexShrink: 0,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-base)',
          padding: '6px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!selectMode ? (
            <button
              onClick={() => {
                setSelectedIds(new Set());
                setSelectMode(true);
              }}
              style={{
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                borderRadius: 10,
                padding: '6px 10px',
                cursor: 'pointer',
              }}
            >
              Select cards
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setSelectedIds(new Set(displayedFiles.map((f) => f.id)));
                }}
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderRadius: 10,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderRadius: 10,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  opacity: 0.8,
                }}
              >
                Clear
              </button>
              <button
                onClick={() => setSelectMode(false)}
                style={{
                  border: '1px solid var(--accent-fire)',
                  background: 'var(--accent-fire)',
                  color: '#000',
                  fontFamily: "'Chakra Petch', sans-serif",
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  borderRadius: 10,
                  padding: '6px 10px',
                  cursor: 'pointer',
                }}
              >
                Done selecting
              </button>
            </>
          )}
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text-secondary)', opacity: 0.85 }}>
          {selectMode ? `${selectedIds.size} selected` : ''}
        </div>
      </div>
      <DiskBar />
      <Layout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <RoastPanel
            stats={activeTab === 'scheduled' ? firepitStats : spaceStats}
            roastSeed={roastSeed}
            onRoastAgain={handleRoastAgain}
            variant={activeTab === 'scheduled' ? 'firepit' : 'quickScan'}
            deepScanUI={activeTab === 'scheduled' ? undefined : {
              open: deepScanOpen,
              setOpen: setDeepScanOpen,
              running: deepScanRunning,
              progress: deepScanProgress,
              roots: deepScanRoots ?? ensureDefaultDeepRoots(),
              setRoots: setDeepScanRoots,
              minSizeMB: deepScanMinSizeMB,
              setMinSizeMB: setDeepScanMinSizeMB,
              pickFolders: pickMoreFolders,
              start: startDeepScan,
              stop: cancelDeepScan,
            }}
          />
          <CardGrid
            files={displayedFiles}
            loading={loading}
            filtering={isFiltering}
            onFileDrop={handleFilesDrop}
            onUnschedule={handleUnschedule}
            onRevealInFolder={revealInFolder}
            duplicateIds={duplicateSet}
            activeTab={activeTab}
            selectionMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={(file) => {
              if (!selectMode) return;
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(file.id)) next.delete(file.id);
                else next.add(file.id);
                return next;
              });
            }}
          />
        </div>
        <Firepit
          fireState={fireState}
          onRectUpdate={setFirepitRect}
          isScheduledTab={activeTab === 'scheduled'}
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
