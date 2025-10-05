import type { SavedLineup } from '../types/lineup';

const STORAGE_KEY = 'lineupxi:saved_lineups:v1';

class StorageFullError extends Error {
  constructor() {
    super('Storage is full—delete old lineups or export');
    this.name = 'StorageFullError';
  }
}

function loadFromStorage(): SavedLineup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('savedLineups: corrupted data (not array), resetting');
      return [];
    }
    return parsed;
  } catch (err) {
    console.warn('savedLineups: failed to parse, resetting', err);
    return [];
  }
}

function saveToStorage(lineups: SavedLineup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lineups));
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      throw new StorageFullError();
    }
    throw err;
  }
}

export function list(): SavedLineup[] {
  const lineups = loadFromStorage();
  return lineups.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function get(id: string): SavedLineup | undefined {
  const lineups = loadFromStorage();
  return lineups.find(lu => lu.id === id);
}

export function saveNew(input: Omit<SavedLineup, 'id' | 'createdAt' | 'updatedAt'>): SavedLineup {
  const lineups = loadFromStorage();
  const now = Date.now();
  const newLineup: SavedLineup = {
    ...input,
    id: `sl_${now}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now
  };
  lineups.push(newLineup);
  saveToStorage(lineups);
  return newLineup;
}

export function update(lu: SavedLineup): SavedLineup {
  const lineups = loadFromStorage();
  const index = lineups.findIndex(item => item.id === lu.id);
  if (index === -1) {
    throw new Error(`Lineup ${lu.id} not found`);
  }
  const updated = { ...lu, updatedAt: Date.now() };
  lineups[index] = updated;
  saveToStorage(lineups);
  return updated;
}

export function remove(id: string): void {
  const lineups = loadFromStorage();
  const filtered = lineups.filter(lu => lu.id !== id);
  saveToStorage(filtered);
}

export function duplicate(id: string, newName?: string): SavedLineup {
  const original = get(id);
  if (!original) {
    throw new Error(`Lineup ${id} not found`);
  }
  const copy = {
    ...original,
    name: newName || `${original.name} (copy)`
  };
  delete (copy as any).id;
  delete (copy as any).createdAt;
  delete (copy as any).updatedAt;
  return saveNew(copy as Omit<SavedLineup, 'id' | 'createdAt' | 'updatedAt'>);
}

export { StorageFullError };
