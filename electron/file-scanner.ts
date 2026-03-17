import * as fs from 'fs';
import * as path from 'path';
import { FileRecord } from '../src/shared/types';
import { computeScore } from '../src/shared/ranking';

const MAX_FILES = 2000;
const SCAN_DIRS = ['Desktop', 'Downloads', 'Documents', 'Pictures', 'Videos'];

function walkDir(dir: string, results: string[], limit: number): void {
  if (results.length >= limit) return;
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (results.length >= limit) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      walkDir(fullPath, results, limit);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
}

export function scanFiles(): FileRecord[] {
  const userProfile = process.env.USERPROFILE || process.env.HOME || '';
  const filePaths: string[] = [];

  for (const dirName of SCAN_DIRS) {
    const dirPath = path.join(userProfile, dirName);
    if (fs.existsSync(dirPath)) {
      walkDir(dirPath, filePaths, MAX_FILES);
    }
    if (filePaths.length >= MAX_FILES) break;
  }

  const records: FileRecord[] = [];
  for (const filePath of filePaths) {
    try {
      const stat = fs.statSync(filePath);
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
  return records;
}
