import {
  BACKUP_STORAGE_KEY,
  MAX_BACKUP_RECORDS
} from './constants';

function readBackups() {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBackups(backups) {
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(backups));
    return true;
  } catch {
    return false;
  }
}

export function listBackups() {
  return readBackups();
}

export function createBackup({ reason, payload }) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const backups = readBackups();
  const nextBackup = {
    id: `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    reason: reason || 'manual',
    createdAt: new Date().toISOString(),
    payload
  };

  const next = [nextBackup, ...backups].slice(0, MAX_BACKUP_RECORDS);
  writeBackups(next);
  return nextBackup;
}

export function restoreBackup(backupId) {
  const backups = readBackups();
  const target = backups.find((item) => item.id === backupId);
  return target?.payload || null;
}

