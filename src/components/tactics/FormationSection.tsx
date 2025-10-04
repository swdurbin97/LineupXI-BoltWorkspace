import React from "react";
import FormationCard from "./FormationCard";
import type { FormationMerged } from "../../types/formation";

type Props = {
  title: string;
  items: FormationMerged[];
};

export default function FormationSection({ title, items }: Props) {
  if (!items?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map(item => <FormationCard key={item.name} data={item} />)}
      </div>
    </section>
  );
}
