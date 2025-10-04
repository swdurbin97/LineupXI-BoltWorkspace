import React, { useEffect, useState } from 'react';
import { useLineupsStore } from '../../store/lineups';

interface Formation {
  code: string;
  name: string;
  slot_map: Array<{
    slot_code: string;
    x: number;
    y: number;
  }>;
}

export default function FormationPicker() {
  const { working, setFormation } = useLineupsStore();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load formations from authoritative source
    fetch('/data/formations-authoritative.json')
      .then(res => res.json())
      .then(data => {
        setFormations(data.formations || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load formations:', err);
        setFormations([]);
        setLoading(false);
      });
  }, []);

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const formation = formations.find(f => f.code === code);
    if (formation) {
      const slotCodes = formation.slot_map.map(s => s.slot_code);
      setFormation(code, slotCodes);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading formations...</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Formation:</label>
      <select
        value={working?.formationCode || ''}
        onChange={handleFormationChange}
        className="px-3 py-1.5 border rounded-lg text-sm"
      >
        <option value="">Select formation...</option>
        {formations.map(f => (
          <option key={f.code} value={f.code}>
            {f.name || f.code}
          </option>
        ))}
      </select>
    </div>
  );
}