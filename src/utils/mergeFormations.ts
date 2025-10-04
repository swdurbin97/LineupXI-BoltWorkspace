import tacticsData from "../data/tactics.json";
import type { FormationSeed, TacticsText, FormationMerged } from "../types/formation";

const inferBackline = (name: string): 3 | 4 | 5 | undefined => {
  const m = name?.match(/^\s*([345])/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return (n === 3 || n === 4 || n === 5) ? (n as 3|4|5) : undefined;
};

const k = (s: string) => s.toLowerCase().replace(/[^0-9a-z]+/g, "");

export type GroupedFormations = {
  back3: FormationMerged[];
  back4: FormationMerged[];
  back5: FormationMerged[];
  unknown: FormationMerged[];
};

let formationsCache: FormationSeed[] | null = null;

async function loadFormations(): Promise<FormationSeed[]> {
  if (formationsCache) return formationsCache;

  const response = await fetch('/data/formations.json');
  const data = await response.json();
  formationsCache = data.formations;
  return formationsCache;
}

export async function getMergedFormations(): Promise<GroupedFormations> {
  const formations = (await loadFormations()).map(f => ({
    ...f,
    backline: f.backline ?? inferBackline(f.name),
  }));

  const tIndex = new Map<string, TacticsText>();
  (tacticsData as TacticsText[]).forEach(t => {
    if (t?.name) tIndex.set(k(t.name), t);
  });

  const merged: FormationMerged[] = formations.map(f => {
    const tactics = tIndex.get(k(f.name));
    return { ...f, tactics };
  });

  const groups: GroupedFormations = { back3: [], back4: [], back5: [], unknown: [] };
  for (const m of merged) {
    if (m.backline === 3) groups.back3.push(m);
    else if (m.backline === 4) groups.back4.push(m);
    else if (m.backline === 5) groups.back5.push(m);
    else groups.unknown.push(m);
  }

  // Sort each group by name (natural-ish)
  const byName = (a: FormationMerged, b: FormationMerged) => a.name.localeCompare(b.name, undefined, { numeric: true });
  groups.back3.sort(byName);
  groups.back4.sort(byName);
  groups.back5.sort(byName);
  groups.unknown.sort(byName);

  return groups;
}
