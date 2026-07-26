import React from "react";
import { Search, RotateCcw, Sparkles } from "lucide-react";

export default function EmptyState({ onReset }) {
  return (
    <div className="bg-white border border-brand-200/80 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-premium space-y-5 my-6 select-none">
      <div className="w-16 h-16 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center justify-center text-amber-500 mx-auto shadow-3xs">
        <Search size={28} />
      </div>

      <div>
        <h3 className="text-base font-black text-brand-950">No matching jobs found</h3>
        <p className="text-xs text-brand-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          We couldn't find any listings matching your search terms and filters. Try adjusting your keyword or clearing filters.
        </p>
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-950 hover:bg-brand-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm hover-lift"
        >
          <RotateCcw size={14} />
          <span>Reset Search & Filters</span>
        </button>
      )}
    </div>
  );
}
