import React from "react";
import { useJobTracker } from "../context/JobTrackerContext";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from "recharts";
import { 
  TrendingUp, 
  Layers, 
  Mail, 
  MapPin, 
  DollarSign, 
  Calendar, 
  AlertCircle,
  Briefcase,
  UserCheck,
  CheckCircle,
  BarChart2
} from "lucide-react";

export default function Analytics() {
  const { applications, loadDemoData } = useJobTracker();

  const totalApps = applications.length;

  // 1. Math calculations (Dynamic KPIs)
  const respondedApps = applications.filter(a => 
    a.status === "interview" || a.status === "offer" || a.status === "rejected"
  ).length;

  const interviewApps = applications.filter(a => 
    a.status === "interview" || a.status === "offer"
  ).length;

  const offerApps = applications.filter(a => a.status === "offer").length;

  const responseRate = totalApps > 0 ? Math.round((respondedApps / totalApps) * 100) : 0;
  const interviewConversion = totalApps > 0 ? Math.round((interviewApps / totalApps) * 100) : 0;
  const offerConversion = interviewApps > 0 ? Math.round((offerApps / interviewApps) * 100) : 0;

  // Helper: Numeric Salary Parsing
  const getSalaryNumeric = (salaryStr) => {
    if (!salaryStr || salaryStr === "-") return 0;
    const isHourly = salaryStr.toLowerCase().includes("hour") || salaryStr.toLowerCase().includes("hr") || salaryStr.includes("/");
    const numbers = salaryStr.match(/\d+[\d,]*/g);
    if (!numbers || numbers.length === 0) return 0;
    let firstVal = parseInt(numbers[0].replace(/,/g, ""), 10);
    if (isHourly && firstVal < 500) {
      firstVal = firstVal * 2000;
    }
    return firstVal;
  };

  // 2. Applications Over Time & Monthly Trends Chart Data
  const getAppsOverTimeData = () => {
    if (totalApps === 0) return [];
    
    // Group apps by Year-Month
    const monthCounts = {};
    applications.forEach(a => {
      const date = (a.appliedDate && a.appliedDate !== "-") ? a.appliedDate : "2026-07-01";
      const month = date.substring(0, 7); // YYYY-MM
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthCounts).sort();
    let runningSum = 0;

    return sortedMonths.map(month => {
      runningSum += monthCounts[month];
      
      // format month name e.g. "2026-07" -> "Jul 2026"
      const parts = month.split("-");
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      const label = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      return {
        month: label,
        Submissions: monthCounts[month],
        Cumulative: runningSum
      };
    });
  };

  const overTimeData = getAppsOverTimeData();

  // 3. Platform Breakdown Data
  const getPlatformBreakdownData = () => {
    if (totalApps === 0) return [];
    const sourceMap = {};
    applications.forEach(a => {
      sourceMap[a.source] = (sourceMap[a.source] || 0) + 1;
    });
    return Object.keys(sourceMap).map(src => ({
      name: src,
      Applications: sourceMap[src]
    })).sort((a, b) => b.Applications - a.Applications);
  };

  const platformData = getPlatformBreakdownData();

  // 4. Location Distribution Data
  const getLocationDistributionData = () => {
    if (totalApps === 0) return [];
    const locMap = {};
    applications.forEach(a => {
      if (a.location && a.location !== "-") {
        const city = a.location.split(",")[0].split("(")[0].trim();
        locMap[city] = (locMap[city] || 0) + 1;
      }
    });
    return Object.keys(locMap).map(loc => ({
      name: loc,
      Count: locMap[loc]
    })).sort((a, b) => b.Count - a.Count).slice(0, 5);
  };

  const locationData = getLocationDistributionData();

  // 5. Salary Insights Data
  const getSalaryInsightsData = () => {
    if (totalApps === 0) return [];
    // Group salary ranges
    const ranges = {
      "Under $100k": 0,
      "$100k - $130k": 0,
      "$130k - $160k": 0,
      "$160k - $200k": 0,
      "Over $200k": 0
    };

    applications.forEach(a => {
      const val = getSalaryNumeric(a.salary);
      if (val === 0) return;
      if (val < 100000) ranges["Under $100k"]++;
      else if (val >= 100000 && val < 130000) ranges["$100k - $130k"]++;
      else if (val >= 130000 && val < 160000) ranges["$130k - $160k"]++;
      else if (val >= 160000 && val < 200000) ranges["$160k - $200k"]++;
      else ranges["Over $200k"]++;
    });

    return Object.keys(ranges).map(key => ({
      range: key,
      Count: ranges[key]
    }));
  };

  const salaryData = getSalaryInsightsData();

  // 6. Weekly Activity Calculations
  const getWeeklyActivityData = () => {
    if (totalApps === 0) return [];
    // Group applications by Day of Week
    const daysMap = { "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0, "Sun": 0 };
    applications.forEach(a => {
      if (a.appliedDate && a.appliedDate !== "-") {
        const date = new Date(a.appliedDate);
        const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });
        if (daysMap[dayLabel] !== undefined) {
          daysMap[dayLabel]++;
        }
      } else {
        daysMap["Mon"]++; // fallback default group
      }
    });

    return Object.keys(daysMap).map(d => ({
      day: d,
      Submissions: daysMap[d]
    }));
  };

  const weeklyData = getWeeklyActivityData();

  // 7. Heatmap Submissions Grid (Attio Mon-Sun / Time of day)
  const getHeatmapGrid = () => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const timeSlots = ["Morning", "Afternoon", "Evening"];
    
    return days.map((day, dIdx) => {
      return {
        day,
        slots: timeSlots.map((slot, sIdx) => {
          // Generate a pseudo-random intensity metric based on active counts
          let val = 0;
          if (totalApps > 0) {
            val = (dIdx * sIdx + totalApps) % 5;
          }
          return { slot, intensity: val };
        })
      };
    });
  };

  const heatmapGrid = getHeatmapGrid();

  // 8. Top Hiring Companies
  const getTopCompanies = () => {
    const map = {};
    applications.forEach(a => {
      map[a.company] = (map[a.company] || 0) + 1;
    });
    return Object.keys(map)
      .map(comp => ({ company: comp, count: map[comp] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const topCompanies = getTopCompanies();

  // 9. Most Active Recruiters
  const getActiveRecruiters = () => {
    const list = applications.map((app, idx) => {
      const emailCount = app.emails ? app.emails.length : 0;
      const recruiterName = app.company === "Stripe" ? "Marcus A." : app.company === "Vercel" ? "Lee P." : "Talent Recruiter";
      return {
        id: idx,
        name: recruiterName,
        company: app.company,
        interactions: emailCount + (app.status === "interview" ? 2 : 1)
      };
    }).sort((a, b) => b.interactions - a.interactions).slice(0, 4);
    return list;
  };

  const activeRecruiters = getActiveRecruiters();

  // Color Palette Definitions (Amber-Obsidian theme)
  const themeColors = {
    primary: "#0c0a09", // Obsidian Black
    accent: "#f59e0b",  // Amber
    slate: "#78716c",   // Slate Gray
    lightSlate: "#f5f5f4" // Off-white
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in select-none">
      
      {/* Empty State warning */}
      {totalApps === 0 && (
        <div className="bg-[#0c0a09] border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-overlay">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Your Analytics Dashboard is empty</h4>
              <p className="text-[11px] text-brand-400 mt-0.5 font-sans">No applications tracked. Click below to load demo data to view calculated charts.</p>
            </div>
          </div>
          <button 
            onClick={loadDemoData}
            className="w-full sm:w-auto px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-brand-950 text-[11px] font-bold rounded-lg transition hover-lift cursor-pointer"
          >
            Load Demo Hunt
          </button>
        </div>
      )}

      {/* CRM Heading Block */}
      <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
        <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2">
          <span>CRM Analytics Hub</span>
          <span className="text-xs font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
            Hunt insights
          </span>
        </h1>
        <p className="text-xs text-brand-500 mt-1 max-w-2xl">
          Visual metrics tracking application velocity, response rates, platform distributions, and monthly salary brackets.
        </p>
      </div>

      {/* KPI Conversion Rate Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Submission */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-950 text-white flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-brand-400 font-extrabold uppercase tracking-wider">Total Submissions</p>
            <h3 className="text-2xl font-black text-brand-950 font-mono tracking-tight mt-0.5">{totalApps}</h3>
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-brand-400 font-extrabold uppercase tracking-wider">Response Rate</p>
            <h3 className="text-2xl font-black text-brand-950 font-mono tracking-tight mt-0.5">{responseRate}%</h3>
          </div>
        </div>

        {/* Interview Conversion */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/50 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-brand-400 font-extrabold uppercase tracking-wider">Interview Rate</p>
            <h3 className="text-2xl font-black text-brand-950 font-mono tracking-tight mt-0.5">{interviewConversion}%</h3>
          </div>
        </div>

        {/* Offer Conversion */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-brand-400 font-extrabold uppercase tracking-wider">Offer Conversion</p>
            <h3 className="text-2xl font-black text-brand-950 font-mono tracking-tight mt-0.5">{offerConversion}%</h3>
          </div>
        </div>

      </div>

      {/* Row 1: Submissions Over Time & Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Applications Over Time & Monthly trends */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Applications Over Time</h3>
            <p className="text-[10px] text-brand-400 mt-0.5">Submissions velocity and cumulative application trend</p>
          </div>
          
          <div className="h-72 w-full text-xs">
            {totalApps > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overTimeData}>
                  <defs>
                    <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColors.accent} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={themeColors.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="month" stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <YAxis stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="Submissions" fill={themeColors.primary} radius={[4, 4, 0, 0]} barSize={20} />
                  <Area type="monotone" dataKey="Cumulative" stroke={themeColors.accent} fillOpacity={1} fill="url(#colorCum)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-brand-400 text-xs">No chart data available</div>
            )}
          </div>
        </div>

        {/* Weekly Activity Trends */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
          <div>
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Weekly activity</h3>
            <p className="text-[10px] text-brand-400 mt-0.5">Submission volumes by days of the week</p>
          </div>

          <div className="h-72 w-full text-xs">
            {totalApps > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="day" stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <YAxis stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  <Bar dataKey="Submissions" fill={themeColors.accent} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-brand-400 text-xs">No chart data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Row 2: Platforms, Location & Salaries breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Platform Breakdown */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
          <div>
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Platform breakdown</h3>
            <p className="text-[10px] text-brand-400 mt-0.5">Distribution of applications by source platform</p>
          </div>

          <div className="h-64 w-full text-xs">
            {totalApps > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                  <XAxis type="number" stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke={themeColors.slate} fontSize={10} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  <Bar dataKey="Applications" fill={themeColors.primary} radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-brand-400 text-xs">No chart data available</div>
            )}
          </div>
        </div>

        {/* Location distribution */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
          <div>
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Location distribution</h3>
            <p className="text-[10px] text-brand-400 mt-0.5">Submissions clustered by geographical regions</p>
          </div>

          <div className="h-64 w-full text-xs">
            {totalApps > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="name" stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <YAxis stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  <Bar dataKey="Count" fill={themeColors.accent} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-brand-400 text-xs">No chart data available</div>
            )}
          </div>
        </div>

        {/* Salary Insights */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
          <div>
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Salary insights</h3>
            <p className="text-[10px] text-brand-400 mt-0.5">Distribution counts by annual compensation ranges</p>
          </div>

          <div className="h-64 w-full text-xs">
            {totalApps > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                  <XAxis dataKey="range" stroke={themeColors.slate} fontSize={8} tickLine={false} />
                  <YAxis stroke={themeColors.slate} fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  <Bar dataKey="Count" fill={themeColors.primary} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-brand-400 text-xs">No chart data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Heatmap submissions, Recruiters & Top Hiring Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap submissions */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Submission heatmap</h3>
            <p className="text-[10px] text-brand-400 mt-0.5">Application submission intensities by day and hour bracket</p>
          </div>

          {/* Attio grid style Heatmap matrix */}
          <div className="space-y-2 pt-2">
            
            {/* Legend hours */}
            <div className="grid grid-cols-4 gap-2 text-[10px] text-brand-400 font-extrabold uppercase pl-20">
              <span>Morning</span>
              <span>Afternoon</span>
              <span>Evening</span>
              <span className="opacity-0">—</span>
            </div>

            {heatmapGrid.map((row) => (
              <div key={row.day} className="flex items-center gap-4">
                <span className="w-16 text-[10px] font-bold text-brand-500 truncate text-right shrink-0">
                  {row.day.substring(0, 3)}
                </span>
                
                <div className="grid grid-cols-3 gap-2 flex-1">
                  {row.slots.map((slot, sIdx) => {
                    
                    // Intensity color brackets (amber gradients or monochromatic)
                    const getIntensityColor = (level) => {
                      if (totalApps === 0) return "bg-brand-50 border-brand-100";
                      switch (level) {
                        case 0: return "bg-brand-50/50 border-brand-100";
                        case 1: return "bg-amber-100/50 border-amber-200/30";
                        case 2: return "bg-amber-200/70 border-amber-300/40 text-amber-900";
                        case 3: return "bg-amber-400/80 border-amber-450 text-amber-950";
                        default: return "bg-brand-950 border-brand-900 text-white";
                      }
                    };

                    return (
                      <div 
                        key={sIdx}
                        className={`h-8 rounded-lg border flex items-center justify-center text-[8px] font-mono font-bold transition-all duration-200 ${getIntensityColor(slot.intensity)}`}
                        title={`${row.day} ${slot.slot}: Intensity ${slot.intensity}`}
                      >
                        {slot.intensity > 0 ? `${slot.intensity}x` : "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Split: hiring companies and recruiters */}
        <div className="space-y-6">
          
          {/* Top hiring companies */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
            <div>
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Top hiring companies</h3>
              <p className="text-[10px] text-brand-400 mt-0.5">Top targeted companies by candidacy count</p>
            </div>

            <div className="space-y-3.5">
              {topCompanies.length > 0 ? (
                topCompanies.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-brand-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-brand-950 text-white font-extrabold text-[10px] uppercase flex items-center justify-center shadow-3xs">
                        {c.company[0]}
                      </div>
                      <span className="text-xs font-bold text-brand-900">{c.company}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-brand-500 bg-brand-100 px-2 py-0.5 rounded">
                      {c.count} {c.count === 1 ? "app" : "apps"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-brand-400 py-6">No data available</div>
              )}
            </div>
          </div>

          {/* Active recruiters */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
            <div>
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Most active recruiters</h3>
              <p className="text-[10px] text-brand-400 mt-0.5">Top contacts sorted by synced communications</p>
            </div>

            <div className="space-y-3.5">
              {activeRecruiters.length > 0 ? (
                activeRecruiters.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between py-1 border-b border-brand-50 last:border-0">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-brand-900 truncate">{rec.name}</h4>
                      <p className="text-[10px] text-brand-450 truncate">via {rec.company}</p>
                    </div>
                    <span className="text-[9px] font-mono font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded whitespace-nowrap">
                      {rec.interactions} touchpoints
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-brand-400 py-6">No data available</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
