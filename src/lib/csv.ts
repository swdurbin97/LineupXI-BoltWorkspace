import { Player } from './types';

export function playersToCSV(players: Player[]): string {
  if (!players || players.length === 0) return '';
  
  const headers = ['Name', 'Jersey', 'Position', 'Foot', 'Status', 'Notes'];
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

export function csvToPlayers(csv: string): Player[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Skip header row
  const players: Player[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quoted values)
    const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 2) continue;
    
    const values = matches.map(m => m.replace(/^"|"$/g, '').trim());
    
    const player: Player = {
      id: `player-${Date.now()}-${i}`,
      name: values[0] || '',
      jersey: parseInt(values[1]) || 0,
      primaryPos: values[2] || undefined,
      foot: (values[3] as 'L' | 'R' | 'B') || 'R',
      status: (values[4] as Player['status']) || 'available',
      notes: values[5] || undefined
    };
    
    if (player.name && player.jersey) {
      players.push(player);
    }
  }
  
  return players;
}