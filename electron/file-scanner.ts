import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { FileRecord } from '../src/shared/types';
import { computeScore } from '../src/shared/ranking';

const MAX_FILES = 2000;
const SCAN_DIRS = ['Desktop', 'Downloads', 'Documents', 'Pictures', 'Videos'];

let cachedResults: FileRecord[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function walkDir(dir: string, results: string[], limit: number): Promise<void> {
  if (results.length >= limit) return;
  let entries: fs.Dirent[];
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (results.length >= limit) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      await walkDir(fullPath, results, limit);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
}

export async function scanFiles(bustCache = false): Promise<FileRecord[]> {
  if (!bustCache && cachedResults && (Date.now() - cacheTime < CACHE_TTL_MS)) {
    return cachedResults;
  }

  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const filePaths: string[] = [];

  for (const dirName of SCAN_DIRS) {
    const dirPath = path.join(userProfile, dirName);
    try {
      await fsp.access(dirPath);
      await walkDir(dirPath, filePaths, MAX_FILES);
    } catch {
      continue;
    }
    if (filePaths.length >= MAX_FILES) break;
  }

  const records: FileRecord[] = [];
  for (const filePath of filePaths) {
    try {
      const stat = await fsp.stat(filePath);
      if (!stat.isFile()) continue;

      const ext = path.extname(filePath).toLowerCase();
      const name = path.basename(filePath);
      const sizeMB = stat.size / (1024 * 1024);

      const partial = {
        id: `scan-${filePath}`,
        path: filePath,
        name,
        extension: ext,
        sizeMB,
        createdAt: stat.birthtime.getTime(),
        lastOpenedAt: stat.mtime.getTime(),
        isScheduled: false,
      };

      records.push({
        ...partial,
        deletionScore: computeScore(partial),
      });
    } catch {
      // skip files we can't stat
    }
  }

  records.sort((a, b) => b.deletionScore - a.deletionScore);
  cachedResults = records;
  cacheTime = Date.now();
  return records;
}
