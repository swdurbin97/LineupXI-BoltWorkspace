import React, { useEffect, useState } from "react";
import { getMergedFormations, GroupedFormations } from "../utils/mergeFormations";
import FormationSection from "../components/tactics/FormationSection";

export default function TacticsFormations() {
  const [groups, setGroups] = useState<GroupedFormations>({
    back3: [],
    back4: [],
    back5: [],
    unknown: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMergedFormations().then(data => {
      setGroups(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p>Loading formations...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Tactics · Formations</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Grouped by backline. Click a card to view details (coming next).
        </p>
      </header>
      <FormationSection title="3-Back" items={groups.back3} />
      <FormationSection title="4-Back" items={groups.back4} />
      <FormationSection title="5-Back" items={groups.back5} />
      <FormationSection title="Other"  items={groups.unknown} />
    </div>
  );
}
