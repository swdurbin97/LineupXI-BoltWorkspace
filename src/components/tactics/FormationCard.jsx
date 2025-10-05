import { Link } from "react-router-dom";
import FormationRenderer from "../field/FormationRenderer";

export default function FormationCard({ formation }) {
  if (!formation) return null;

  const hasSlotMap = formation.slot_map && formation.slot_map.length > 0;

  return (
    <Link
      to={`/tactics/formations/${formation.code}`}
      className="block rounded-lg border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all overflow-hidden"
    >
      {/* Formation Title (above preview) */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-base font-semibold text-gray-900">{formation.name}</h3>
        {formation.style && (
          <p className="mt-0.5 text-xs text-gray-500">{formation.style}</p>
        )}
      </div>

      {/* Mini Formation Preview */}
      {hasSlotMap && (
        <div
          className="aspect-[105/68] w-full bg-gray-50 flex items-center justify-center overflow-hidden"
          aria-label={`Formation preview for ${formation.name}`}
        >
          <FormationRenderer
            formation={formation}
            interactive={false}
            showLabels={false}
            markerScale={0.80}
            className="w-full"
            targetHeight={160}
          />
        </div>
      )}

      {/* Formation Description (below preview) */}
      {formation.description && (
        <div className="px-4 pb-4 pt-2">
          <p className="text-sm text-gray-600 line-clamp-2">{formation.description}</p>
        </div>
      )}
    </Link>
  );
}
