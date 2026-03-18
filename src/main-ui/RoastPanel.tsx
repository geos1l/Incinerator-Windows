import React from 'react';
import { FileRecord } from '../shared/types';

export interface SpaceStats {
  totalGB: number;
  fileCount: number;
  videosGB: number;
  photosGB: number;
  appsGB: number;
  docsGB: number;
  archivesGB: number;
  audioGB: number;
  otherGB: number;
  installersGB: number;
  installersCount: number;
  duplicatesCount: number;
  neverOpenedCount: number;
  scheduledCount: number;
  highScoreCount: number;
}

interface RoastPanelProps {
  stats: SpaceStats | null;
  roastSeed: number;
  onRoastAgain: () => void;
}

function formatGB(value: number): string {
  if (value >= 1024) return `${(value / 1024).toFixed(1)} TB`;
  return `${value.toFixed(1)} GB`;
}

export default function RoastPanel({ stats, roastSeed, onRoastAgain }: RoastPanelProps) {
  if (!stats || stats.totalGB <= 0) {
    return null;
  }

  const pct = (gb: number) =>
    stats.totalGB > 0 ? Math.round((gb / stats.totalGB) * 100) : 0;

  const dominantType =
    stats.videosGB >= stats.photosGB &&
    stats.videosGB >= stats.appsGB &&
    stats.videosGB >= stats.docsGB
      ? 'videos'
      : stats.photosGB >= stats.appsGB && stats.photosGB >= stats.docsGB
      ? 'photos'
      : stats.appsGB >= stats.docsGB
      ? 'apps'
      : 'docs';

  const pick = (variants: string[]): string => variants[Math.abs(roastSeed) % variants.length];
  let line: string;
  if (stats.installersGB > 5) {
    line = pick([
      `You’re babysitting ${stats.installersCount} installers. It’s like keeping every Amazon box after you’ve opened it.`,
      `${stats.installersCount} installers are still living rent-free on your drive.`,
      `You kept ${stats.installersCount} installers "just in case." The pit calls that clutter.`,
    ]);
  } else if (stats.duplicatesCount > 20) {
    line = pick([
      `You’ve got duplicates everywhere. The pit is happy to take the extra copies (${stats.duplicatesCount} suspects).`,
      `Duplicate city: ${stats.duplicatesCount} suspects. The firepit can handle the paperwork.`,
      `${stats.duplicatesCount} duplicate files are doing the same job twice.`,
    ]);
  } else if (stats.neverOpenedCount > 30) {
    line = pick([
      `You downloaded ${stats.neverOpenedCount} things and never opened them once. Bold strategy.`,
      `${stats.neverOpenedCount} files have never been opened. Collector energy.`,
      `Unused downloads: ${stats.neverOpenedCount}. Your SSD remembers all of them.`,
    ]);
  } else if (stats.highScoreCount > 40) {
    line = pick([
      `At least ${stats.highScoreCount} files are screaming to be burned. The firepit is under-staffed.`,
      `${stats.highScoreCount} files scored high enough to become kindling.`,
      `The pit has ${stats.highScoreCount} prime candidates waiting in line.`,
    ]);
  } else if (stats.scheduledCount > 0) {
    line = pick([
      `You’ve already thrown ${stats.scheduledCount} offerings into the pit. Might as well finish the ritual.`,
      `${stats.scheduledCount} files are already in the firepit queue.`,
      `The firepit is holding ${stats.scheduledCount} files for cleanup day.`,
    ]);
  } else {
    if (dominantType === 'videos') {
      line = pick([
        `Your drive is ${pct(stats.videosGB)}% raw footage. Oscar-winning… or just backlog for the pit.`,
        `Videos eat ${pct(stats.videosGB)}% of your space. Director's cut of clutter.`,
        `${pct(stats.videosGB)}% video usage. The pit calls that binge storage.`,
      ]);
    } else if (dominantType === 'photos') {
      line = pick([
        `${pct(stats.photosGB)}% of your space is memories. Some of them could probably be memories in ash form.`,
        `Photos take ${pct(stats.photosGB)}% of your drive. Not every screenshot is sacred.`,
        `${pct(stats.photosGB)}% photo storage. The duplicates are definitely not sentimental.`,
      ]);
    } else if (dominantType === 'apps') {
      line = pick([
        `Apps are chewing ${pct(stats.appsGB)}% of your space. How many do you actually open?`,
        `Apps claim ${pct(stats.appsGB)}% of disk space. Half of them are probably retired.`,
        `${pct(stats.appsGB)}% belongs to apps. The pit suspects abandonment.`,
      ]);
    } else {
      line = pick([
        `Your documents are nesting. ${pct(stats.docsGB)}% of your space is paperwork with commitment issues.`,
        `Docs use ${pct(stats.docsGB)}% of your drive. Filing cabinet behavior.`,
        `${pct(stats.docsGB)}% of space is documents. Some of those drafts are fossils.`,
      ]);
    }
  }

  const rows = [
    { label: 'Videos', value: stats.videosGB },
    { label: 'Photos', value: stats.photosGB },
    { label: 'Apps', value: stats.appsGB },
    { label: 'Docs', value: stats.docsGB },
    { label: 'Archives', value: stats.archivesGB },
    { label: 'Audio', value: stats.audioGB },
  ].filter((r) => r.value > 0.01);

  return (
    <div
      style={{
        padding: '6px 10px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        flexShrink: 0,
      }}
    >
      <div style={{ flex: '0 1 44%', minWidth: 0, maxWidth: '44%' }}>
        <p
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 12,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.35,
            overflowWrap: 'anywhere',
          }}
        >
          {line}
        </p>
        <button
          onClick={onRoastAgain}
          style={{
            marginTop: 6,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderRadius: 6,
            padding: '3px 7px',
            cursor: 'pointer',
          }}
        >
          Roast me again
        </button>
      </div>

      <div style={{ flex: '1 1 56%', minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Chakra Petch', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 2,
          }}
        >
          What’s eating your space
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10.5,
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
            maxWidth: 320,
          }}
        >
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: 0.9,
              }}
            >
              <span>{row.label}</span>
              <span style={{ opacity: 0.8 }}>
                {formatGB(row.value)} ({pct(row.value)}%)
              </span>
            </div>
          ))}
          <div style={{ marginTop: 2, opacity: 0.65 }}>
            Total: {formatGB(stats.totalGB)} across {stats.fileCount} files
          </div>
        </div>
      </div>
    </div>
  );
}

