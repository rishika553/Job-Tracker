import React from "react";
import { History, Search, X } from "lucide-react";

export default function SearchHistory({ recentSearches, onSelectSearch, onClearHistory }) {
  if (!recentSearches || recentSearches.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono">
        <History size={12} />
        Recent:
      </span>

      {recentSearches.map((item, idx) => (
        <button
          key={item.id || idx}
          onClick={() => onSelectSearch(item.query, item.location)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-brand-200 hover:border-amber-400/50 hover:bg-amber-50/20 text-brand-700 hover:text-amber-800 rounded-lg text-xs font-semibold transition cursor-pointer shadow-3xs"
        >
          <Search size={11} className="text-brand-400" />
          <span>{item.query}</span>
          {item.location && <span className="text-[10px] text-brand-400">({item.location})</span>}
        </button>
      ))}
    </div>
  );
}
