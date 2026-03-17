export interface FileRecord {
  id: string;
  path: string;
  name: string;
  extension: string;
  sizeMB: number;
  createdAt: number;
  lastOpenedAt: number;
  deletionScore: number;
  isScheduled: boolean;
  scheduledAt?: number;
  daysUntilAutoDelete?: number;
  thumbnailDataUrl?: string;
}

export type FireState = 'ember' | 'low' | 'medium' | 'high';
