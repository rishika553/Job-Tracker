import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function StatCard({ 
  title, 
  value, 
  trend, 
  trendType = "neutral", 
  description, 
  icon, 
  iconBgColor = "bg-primary-50 text-primary-600" 
}) {
  
  const renderTrend = () => {
    if (!trend) return null;
    
    switch (trendType) {
      case "positive":
        return (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
            <ArrowUpRight size={12} />
            {trend}
          </span>
        );
      case "negative":
        return (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
            <ArrowDownRight size={12} />
            {trend}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-md">
            <Minus size={12} />
            {trend}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-premium hover:shadow-premium-hover hover:border-slate-200/60 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1.5 tracking-tight">
            {value}
          </h3>
        </div>
        
        <div className={`w-8 h-8 rounded-lg ${iconBgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-500">
        {renderTrend()}
        <span className="truncate">{description}</span>
      </div>
    </div>
  );
}
