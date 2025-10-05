import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import FormationRenderer from '../../components/field/FormationRenderer';
import { loadTactics } from '../../data/tactics';

export default function FormationDetail() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [formations, setFormations] = useState([]);
  const [tacticsData, setTacticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [formRes, tactRes] = await Promise.all([
          fetch('/data/formations.json'),
          loadTactics()
        ]);

        if (!formRes.ok) throw new Error('Failed to load formations');
        const formData = await formRes.json();

        if (!alive) return;
        setFormations(formData.formations || []);
        setTacticsData(tactRes.tactics_content || []);
        setLoading(false);
      } catch (error) {
        if (!alive) return;
        setErr(error.message || String(error));
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Find canonical formation by exact code match (for rendering)
  const formation = useMemo(() => {
    const f = formations.find(f => String(f.code) === String(code));
    if (!f) {
      console.warn('⚠️  Formation not found:', { code });
      return null;
    }
    if (!f.slot_map || f.slot_map.length === 0) {
      console.warn('⚠️  Formation has no slot_map:', { code, name: f.name });
    }
    return f;
  }, [formations, code]);

  // Find tactics content by exact NAME match (primary key)
  const tactics = useMemo(() => {
    if (!formation) return null;
    const t = tacticsData.find(t => t.name === formation.name);
    if (!t) {
      console.warn('⚠️  Tactics content not found:', { name: formation.name });
    }
    return t;
  }, [formation, tacticsData]);

  // Merge for display
  const item = useMemo(() => {
    if (!formation) return null;
    return {
      ...formation,
      ...tactics,
      advantages: tactics?.advantages || [],
      disadvantages: tactics?.disadvantages || [],
      howToCounter: tactics?.how_to_counter || [],
      suggestedCounters: tactics?.suggested_counters || [],
      roles: tactics?.player_roles || []
    };
  }, [formation, tactics]);

  // Helper: get canonical formation by name for routing
  const getCanonicalByName = (name) => {
    if (!name) return null;
    const normalized = name.trim().toLowerCase();
    const formation = formations.find(f =>
      f.name?.toLowerCase() === normalized
    );
    if (!formation) {
      console.warn(`⚠️  Suggested counter not found in canonical formations: "${name}"`);
      return null;
    }
    return { code: formation.code, name: formation.name };
  };

  if (loading) return <div className="px-6 py-10 text-sm text-gray-500">Loading…</div>;
  if (err) return <div className="px-6 py-10 text-sm text-red-600">Error: {err}</div>;
  if (!item) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-gray-500">Formation not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back
        </button>
      </div>
    );
  }

  const isStub = item.overview === 'Tactical notes coming soon.';

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            {isStub && (
              <span
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded"
                title="This formation has placeholder tactical notes. Full content coming soon."
              >
                Content stub
              </span>
            )}
          </div>
          {item.description && (
            <p className="mt-1 text-sm text-gray-600">{item.description}</p>
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          ← Back
        </button>
      </div>

      {/* Pitch Visualization */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <FormationRenderer formation={formation} />
      </div>

      {/* Tactics Content Sections */}
      <div className="space-y-6">
        {/* Overview */}
        {item.overview && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              {item.overview.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {/* Advantages */}
        {item.advantages && item.advantages.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Advantages</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {item.advantages.map((adv, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{adv}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Disadvantages */}
        {item.disadvantages && item.disadvantages.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Disadvantages</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {item.disadvantages.map((dis, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-red-600 mt-0.5">✗</span>
                  <span>{dis}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Player Roles */}
        {item.roles && item.roles.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Player Roles</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {item.roles.map((role, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{role}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* How to Counter */}
        {item.howToCounter && item.howToCounter.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">How to Counter</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              {item.howToCounter.map((counter, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">→</span>
                  <span>{counter}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Suggested Counters */}
        {item.suggestedCounters && item.suggestedCounters.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Suggested Counters</h2>
            <div className="flex flex-wrap gap-2">
              {item.suggestedCounters.map((counter, idx) => {
                // Try to extract formation name from the counter text
                // Counter format might be "4-3-3 – Offers width and overloads"
                const parts = counter.split(/[–—:]/);
                const potentialName = parts[0].trim();
                const canonical = getCanonicalByName(potentialName);

                if (canonical) {
                  // Clickable chip
                  return (
                    <Link
                      key={idx}
                      to={`/tactics/formations/${canonical.code}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                      title={counter}
                    >
                      {potentialName}
                    </Link>
                  );
                } else {
                  // Non-clickable chip
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md"
                      title={counter}
                    >
                      {potentialName}
                    </span>
                  );
                }
              })}
            </div>
          </section>
        )}

        {/* Summary Table */}
        {item.summary_table && item.summary_table.trim() && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
            <pre className="text-xs font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
{item.summary_table}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
