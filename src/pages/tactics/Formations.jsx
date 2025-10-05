import { useEffect, useMemo, useState } from "react";
import FormationCard from "../../components/tactics/FormationCard";
import { loadTactics } from "../../data/tactics";

function groupByBackline(list) {
  const groups = { "3-Back": [], "4-Back": [], "5-Back": [], Other: [] };
  for (const f of list || []) {
    const first = String(f?.name ?? "").split("-")[0];
    const n = parseInt(first, 10);
    if (n === 3) groups["3-Back"].push(f);
    else if (n === 4) groups["4-Back"].push(f);
    else if (n === 5) groups["5-Back"].push(f);
    else groups.Other.push(f);
  }
  return groups;
}

export default function FormationsPage() {
  const [data, setData] = useState([]);
  const [tacticsData, setTacticsData] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/data/formations.json").then((r) => r.json()),
      loadTactics()
    ])
      .then(([formData, tactData]) => {
        setData(Array.isArray(formData) ? formData : formData?.formations ?? []);
        setTacticsData(tactData.tactics_content || []);
      })
      .catch(() => {
        setData([]);
        setTacticsData([]);
      });
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((f) => {
      // Search in formation metadata
      const formationText = [f?.name, f?.nickname, f?.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Find tactics content for this formation and search in it
      const tactics = tacticsData.find(t => t.name === f.name);
      const tacticsText = [
        tactics?.overview,
        ...(tactics?.advantages || []),
        ...(tactics?.disadvantages || []),
        ...(tactics?.player_roles || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return formationText.includes(needle) || tacticsText.includes(needle);
    });
  }, [data, tacticsData, q]);

  const groups = useMemo(() => groupByBackline(filtered), [filtered]);

  const Section = ({ title, items }) => {
    if (!items?.length) return null;
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <span className="text-sm text-gray-500">{items.length} formations</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <FormationCard key={f.name} formation={f} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Formations</h1>
          <p className="text-gray-600">Grouped by backline. Search to filter.</p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search formations..."
          className="w-64 rounded-xl border px-3 py-2 text-sm outline-none focus:ring"
        />
      </div>

      <Section title="3-Back" items={groups["3-Back"]} />
      <Section title="4-Back" items={groups["4-Back"]} />
      <Section title="5-Back" items={groups["5-Back"]} />
      <Section title="Other" items={groups["Other"]} />
    </div>
  );
}
