// Wrap the card in a Link to the detail page
import { Link } from "react-router-dom";

export default function FormationCard({ formation }) {
  const code = String(formation.code || formation.name || "").replace(/\s+/g, "");
  const displayName = formation.title || formation.name || formation.formation_code || code;
  const style = formation.style;
  
  return (
    <Link to={`/tactics/formations/${code}`} className="block group">
      <div className="border rounded-xl px-4 py-3 hover:shadow-sm transition bg-white hover:border-gray-300">
        <div className="font-medium">{displayName}</div>
        {style && (
          <div className="text-xs text-gray-500">{style}</div>
        )}
      </div>
    </Link>
  );
}