import React from "react";

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-white/70 border border-brand-200/60 rounded-2xl p-5 shadow-premium animate-pulse space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-150" />
              <div className="space-y-1.5">
                <div className="w-24 h-3 bg-brand-150 rounded" />
                <div className="w-16 h-2 bg-brand-100 rounded" />
              </div>
            </div>
            <div className="w-14 h-4 bg-brand-100 rounded-full" />
          </div>

          <div className="w-3/4 h-4 bg-brand-200 rounded" />

          <div className="flex gap-2">
            <div className="w-16 h-5 bg-brand-100 rounded-md" />
            <div className="w-24 h-5 bg-emerald-50 rounded-md" />
          </div>

          <div className="space-y-1">
            <div className="w-full h-3 bg-brand-100 rounded" />
            <div className="w-5/6 h-3 bg-brand-100 rounded" />
          </div>

          <div className="pt-3 border-t border-brand-100 flex justify-between items-center">
            <div className="w-20 h-3 bg-brand-100 rounded" />
            <div className="w-24 h-8 bg-brand-900/20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
