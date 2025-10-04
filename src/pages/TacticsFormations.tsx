import React from "react";
import { getMergedFormations } from "../utils/mergeFormations";
import FormationSection from "../components/tactics/FormationSection";

export default function TacticsFormations() {
  const groups = getMergedFormations();
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
