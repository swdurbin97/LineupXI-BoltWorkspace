/** Formation detail page */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FormationRenderer from "../../components/field/FormationRenderer";
import { loadTactics } from "../../data/tactics";

export default function FormationDetail() {
  const { code } = useParams(); // e.g. "3412"
  const navigate = useNavigate();
  const [formations, setFormations] = useState([]);
  const [tacticsData, setTacticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showLabels, setShowLabels] = useState(true);

  // Check for debug mode
  const searchParams = new URLSearchParams(window.location.search);
  const showDebug = searchParams.get('debug') === '1';

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Load canonical formation data
        const formationsResponse = await fetch("/data/formations.json");

        if (!formationsResponse.ok) {
          throw new Error("Failed to load formation data");
        }

        const formationsData = await formationsResponse.json();

        // Load tactics content (will return empty array if missing)
        const tactics = await loadTactics();

        if (alive) {
          setFormations(formationsData.formations || []);
          setTacticsData(tactics.tactics_content || []);
          setLoading(false);
        }
      } catch (e) {
        if (alive) { setErr(e.message || "Error loading data"); setLoading(false); }
      }
    })();
    return () => { alive = false; };
  }, []);

  const item = useMemo(() => {
    const lower = String(code || "").toLowerCase().replace(/[^0-9a-z]/g, "");

    // Find formation from formations.json
    const formation = formations.find(f =>
      String(f.code ?? "").toLowerCase().replace(/[^0-9a-z]/g, "") === lower ||
      String(f.name ?? "").toLowerCase().replace(/[^0-9a-z]/g, "") === lower ||
      String(f.formation_code ?? "").toLowerCase().replace(/[^0-9a-z]/g, "") === lower
    );

    if (!formation) return null;

    // Find tactics content by exact code match
    const tactics = tacticsData.find(t => t.code === formation.code);

    // Merge formation and tactics data
    return {
      ...formation,
      ...tactics,
      // Ensure arrays (tactics.json should already have arrays)
      advantages: tactics?.advantages || [],
      disadvantages: tactics?.disadvantages || [],
      howToCounter: tactics?.how_to_counter || [],
      suggestedCounters: tactics?.suggested_counters || [],
      roles: tactics?.player_roles || []
    };
  }, [formations, tacticsData, code]);

  if (loading) return <div className="px-6 py-10 text-sm text-gray-500">Loading…</div>;
  if (err) return <div className="px-6 py-10 text-sm text-red-600">Error: {err}</div>;
  if (!item) {
    return (
      <div className="px-6 py-10 space-y-4">
        <div className="text-lg font-semibold">Formation not found</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 underline">Go back</button>
      </div>
    );
  }

  const displayName = item.title || item.name || item.formation_code || item.code;
  const description = item.overview || item.description;

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{displayName}</div>
          <div className="text-sm text-gray-500">
            {item.style && `${item.style} • `}
            {item.backline ? `${item.backline}-back` : ""}
          </div>
        </div>
        <Link to="/tactics/formations" className="text-sm text-blue-600 underline">← All formations</Link>
      </div>

      <div className="mt-6 mb-8">
        {/* Field Controls */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            <span>Show position labels</span>
          </label>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
            Orientation: Left → Right
          </span>
        </div>

        <FormationRenderer
          formation={item}
          showLabels={showLabels}
          interactive={false}
          targetHeight={520}
        />
      </div>

      {showDebug && item.slot_map && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <div className="font-semibold mb-2">Debug Info</div>
          <div className="space-y-1 mb-3">
            <div><span className="font-medium">Formation:</span> {item.code} - {item.name}</div>
            <div><span className="font-medium">Source:</span> /data/formations.json</div>
            <div><span className="font-medium">Slots:</span> {item.slot_map.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-300">
                  <th className="text-left py-1 px-2">Slot Code</th>
                  <th className="text-right py-1 px-2">X</th>
                  <th className="text-right py-1 px-2">Y</th>
                </tr>
              </thead>
              <tbody>
                {item.slot_map.map((slot, idx) => (
                  <tr key={idx} className="border-b border-blue-100">
                    <td className="py-1 px-2 font-mono">{slot.slot_code}</td>
                    <td className="text-right py-1 px-2 font-mono">{slot.x}</td>
                    <td className="text-right py-1 px-2 font-mono">{slot.y}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tactical content sections */}
      {!item.overview && !item.advantages?.length && !item.disadvantages?.length && !item.roles?.length ? (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-gray-700">
            Tactical notes coming soon for <span className="font-semibold">{item.code}</span>.
          </p>
        </div>
      ) : (
        <>
          {item.overview && (
            <div className="mb-8 leading-7 text-gray-800 whitespace-pre-line">{item.overview}</div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Section title="Advantages" pills={item.advantages} color="green" />
            <Section title="Disadvantages" pills={item.disadvantages} color="red" />
            <Section title="How to counter" pills={item.howToCounter} />
            <Section title="Suggested counter formations" pills={item.suggestedCounters} />
          </div>

          {item.roles?.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-3">Player roles</h3>
              <div className="space-y-3">
                {item.roles.map((r, i) => (
                  <div key={i} className="text-sm leading-6 border-l-2 border-blue-200 pl-3">
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.summary_table && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-3">Summary</h3>
              <div className="text-sm bg-gray-50 rounded-lg p-4 whitespace-pre-line font-mono">
                {item.summary_table}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, pills = [], color }) {
  if (!pills.length) return null;
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs border";
  const palette = color === "green"
    ? "bg-green-50 text-green-800 border-green-200"
    : color === "red"
    ? "bg-red-50 text-red-800 border-red-200"
    : "bg-gray-50 text-gray-800 border-gray-200";
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {pills.map((t, i) => <span key={i} className={`${base} ${palette}`}>{t}</span>)}
      </div>
    </div>
  );
}