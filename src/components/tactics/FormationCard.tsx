import React from "react";
import type { FormationMerged } from "../../types/formation";

type Props = { data: FormationMerged };

export default function FormationCard({ data }: Props) {
  const t = data.tactics;
  return (
    <div className="rounded-2xl border bg-white/50 dark:bg-neutral-900/40 p-4 shadow-sm hover:shadow transition">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">{data.name}</h3>
        {data.nickname && <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800">{data.nickname}</span>}
      </div>
      {t?.description && (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 line-clamp-3">{t.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {t?.advantages?.slice(0,3).map((a, i) => (
          <span key={i} className="text-[11px] px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            + {a}
          </span>
        ))}
        {t?.disadvantages?.slice(0,2).map((d, i) => (
          <span key={i} className="text-[11px] px-2 py-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
            − {d}
          </span>
        ))}
      </div>
      {t?.suggestedCounters && t.suggestedCounters.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">Counters</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {t.suggestedCounters.map((c, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded border">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
