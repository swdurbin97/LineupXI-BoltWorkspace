import { Player } from './types';
import { normalizePosition } from './normalizers';
import { isValidPosition } from '../data/positions';

export interface CSVImportResult {
  players: Player[];
  skipped: Array<{
    row: number;
    reason: string;
    values: string[];
  }>;
}

export function playersToCSV(players: Player[]): string {
  if (!players || players.length === 0) return '';

  const headers = ['name', 'jersey', 'position', 'foot', 'status', 'notes'];
  const rows = players.map(p => [
    p.name,
    p.jersey.toString(),
    p.primaryPos || '',
    p.foot || 'R',
    p.status || 'available',
    p.notes || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function csvToPlayers(csv: string): CSVImportResult {
  const lines = csv.trim().split('\n');
  const result: CSVImportResult = {
    players: [],
    skipped: []
  };

  if (lines.length < 2) return result;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 2) {
      result.skipped.push({
        row: i + 1,
        reason: 'Invalid CSV format',
        values: [line]
      });
      continue;
    }

    const values = matches.map(m => m.replace(/^"|"$/g, '').trim());

    const name = values[0] || '';
    const jersey = parseInt(values[1]) || 0;
    const positionRaw = values[2] || '';
    const foot = (values[3] as 'L' | 'R' | 'B') || 'R';
    const status = (values[4] as Player['status']) || 'available';
    const notes = values[5] || undefined;

    if (!name || !jersey) {
      result.skipped.push({
        row: i + 1,
        reason: 'Missing name or jersey number',
        values
      });
      continue;
    }

    const normalizedPos = normalizePosition(positionRaw);

    if (positionRaw && !normalizedPos) {
      result.skipped.push({
        row: i + 1,
        reason: `Invalid position: "${positionRaw}"`,
        values
      });
      continue;
    }

    const player: Player = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      jersey,
      primaryPos: normalizedPos || undefined,
      foot,
      status,
      notes
    };

    result.players.push(player);
  }

  return result;
}