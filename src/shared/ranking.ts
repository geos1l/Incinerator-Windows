import { FileRecord, FireState } from './types';

export function computeScore(file: Omit<FileRecord, 'deletionScore'>): number {
  const now = Date.now();

  const sizeScore = Math.min(100, (Math.log10(file.sizeMB + 1) / Math.log10(1024)) * 100);

  const daysSinceOpened = (now - file.lastOpenedAt) / (1000 * 60 * 60 * 24);
  const openedScore = Math.min(100, (daysSinceOpened / 365) * 100);

  const daysSinceCreated = (now - file.createdAt) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(100, (daysSinceCreated / 730) * 100);

  return Math.round((sizeScore * 0.50) + (openedScore * 0.35) + (ageScore * 0.15));
}

export function getFireState(totalMB: number): FireState {
  if (totalMB === 0) return 'ember';
  if (totalMB < 500) return 'low';
  if (totalMB < 2000) return 'medium';
  return 'high';
}
