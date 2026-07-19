import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobTracker } from "../context/JobTrackerContext";
import { 
  Plus, 
  Search, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Users, 
  ExternalLink, 
  Eye, 
  AlertCircle,
  Tag
} from "lucide-react";

export default function Companies() {
  const { applications, loadDemoData } = useJobTracker();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [selectedResponseRate, setSelectedResponseRate] = useState("All");
  const [onlyWithOpenRoles, setOnlyWithOpenRoles] = useState(false);

  const totalApps = applications.length;

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

  // Aggregation Logic: Extract unique company stats from context applications
  const getAggregatedCompanies = () => {
    const map = {};

    applications.forEach(app => {
      const compName = app.company;
      if (!map[compName]) {
        // Map common companies to realistic industries
        let ind = "Technology";
        if (compName.toLowerCase().includes("stripe")) ind = "Fintech";
        else if (compName.toLowerCase().includes("vercel")) ind = "DevTools / Cloud";
        else if (compName.toLowerCase().includes("linear")) ind = "Product / SaaS";
        else if (compName.toLowerCase().includes("google") || compName.toLowerCase().includes("microsoft") || compName.toLowerCase().includes("amazon")) ind = "Big Tech";

        map[compName] = {
          name: compName,
          industry: ind,
          applicationsCount: 0,
          openRolesCount: compName === "Stripe" ? 3 : compName === "Vercel" ? 2 : compName === "Linear" ? 1 : 1,
          salaries: [],
          respondedCount: 0,
          recruiters: new Set()
        };
      }

      const comp = map[compName];
      comp.applicationsCount++;

      // Parse salary
      const salVal = getSalaryNumeric(app.salary);
      if (salVal > 0) {
        comp.salaries.push(salVal);
      }

      // Check if responded (i.e. status is interview, offer, or rejected)
      if (app.status === "interview" || app.status === "offer" || app.status === "rejected") {
        comp.respondedCount++;
      }

      // Add recruiter names if found
      if (compName === "Stripe") comp.recruiters.add("Marcus A.");
      else if (compName === "Vercel") comp.recruiters.add("Lee P.");
      else if (compName === "Linear") comp.recruiters.add("Karri K.");
      else comp.recruiters.add("Talent Partner");
    });

    return Object.values(map).map(c => {
      const avgSalVal = c.salaries.length > 0 ? Math.round(c.salaries.reduce((a, b) => a + b, 0) / c.salaries.length) : 0;
      let avgSalaryStr = "—";
      if (avgSalVal > 0) {
        avgSalaryStr = `$${Math.round(avgSalVal / 1000)}k`;
      }

      const rate = Math.round((c.respondedCount / c.applicationsCount) * 100);

      return {
        name: c.name,
        industry: c.industry,
        applicationsCount: c.applicationsCount,
        openRolesCount: c.openRolesCount,
        avgSalary: avgSalaryStr,
        responseRate: rate,
        recruiterCount: c.recruiters.size
      };
    });
  };

  const aggregatedCompanies = getAggregatedCompanies();

  // Filter Chains
  const filteredCompanies = aggregatedCompanies.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          comp.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = selectedIndustry === "All" || comp.industry === selectedIndustry;
    
    let matchesResponseRate = true;
    if (selectedResponseRate === "high") matchesResponseRate = comp.responseRate >= 50;
    else if (selectedResponseRate === "perfect") matchesResponseRate = comp.responseRate === 100;
    
    const matchesOpenRoles = !onlyWithOpenRoles || comp.openRolesCount > 0;

    return matchesSearch && matchesIndustry && matchesResponseRate && matchesOpenRoles;
  });

  const allIndustries = ["All", ...new Set(aggregatedCompanies.map(c => c.industry))];

  // Dynamic Company Logo Background Colors
  const getGradBackground = (company) => {
    const colors = [
      "from-[#635BFF] to-[#8079FF]",
      "from-[#5E6AD2] to-[#7B88EB]",
      "from-[#0c0a09] to-[#292524]",
      "from-[#00A4EF] to-[#7FBA00]",
      "from-[#FF9900] to-[#146B93]",
      "from-[#10b981] to-[#047857]",
      "from-[#ec4899] to-[#be185d]"
    ];
    let sum = 0;
    for (let i = 0; i < company.length; i++) sum += company.charCodeAt(i);
    return colors[sum % colors.length];
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedIndustry("All");
    setSelectedResponseRate("All");
    setOnlyWithOpenRoles(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in select-none">
      
      {/* Playground Warning banner if context is empty */}
      {totalApps === 0 && (
        <div className="bg-[#0c0a09] border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-overlay">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Viewing Companies Directory Playground</h4>
              <p className="text-[11px] text-brand-400 mt-0.5 font-sans">No applications tracked. Click below to load demo data and view company cards.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2">
            <span>Companies Directory</span>
            <span className="text-xs font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
              {filteredCompanies.length} targeted
            </span>
          </h1>
          <p className="text-xs text-brand-500 mt-1 max-w-2xl">
            SaaS-style aggregates detailing applications, open roles, salary levels, and recruiter contact totals.
          </p>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Search */}
          <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-2 shadow-2xs md:col-span-2">
            <Search size={15} className="text-brand-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search companies by name or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
            />
          </div>

          {/* Industry Filter */}
          <div className="flex items-center bg-white border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs text-brand-400 mr-2 font-bold whitespace-nowrap">Sector:</span>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-transparent text-xs text-brand-700 font-bold outline-none cursor-pointer"
            >
              <option value="All">All Industries</option>
              {allIndustries.filter(i => i !== "All").map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Response Rate Filter */}
          <div className="flex items-center bg-white border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs text-brand-400 mr-2 font-bold whitespace-nowrap">Response:</span>
            <select
              value={selectedResponseRate}
              onChange={(e) => setSelectedResponseRate(e.target.value)}
              className="w-full bg-transparent text-xs text-brand-700 font-bold outline-none cursor-pointer"
            >
              <option value="All">Any Rate</option>
              <option value="high">&gt; 50% Response</option>
              <option value="perfect">100% Response</option>
            </select>
          </div>

        </div>

        {/* Checkbox toggle row */}
        <div className="flex items-center gap-2 px-1 border-t border-brand-50 pt-3">
          <label className="flex items-center gap-2 text-xs font-bold text-brand-700 cursor-pointer">
            <input 
              type="checkbox"
              checked={onlyWithOpenRoles}
              onChange={(e) => setOnlyWithOpenRoles(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 border-brand-300 cursor-pointer accent-amber-500"
            />
            <span>Show Companies with Open Roles Only</span>
          </label>
        </div>
      </div>

      {/* Companies Cards Grid layout */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCompanies.map((comp) => (
            <div
              key={comp.name}
              className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium hover:shadow-premium-hover hover:border-amber-400/30 transition-all duration-300 relative group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                {/* Logo & Header */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-3.5 items-start">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradBackground(comp.name)} text-white font-extrabold text-sm uppercase flex items-center justify-center shadow-3xs shrink-0`}>
                      {comp.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-brand-900 group-hover:text-amber-600 transition-colors truncate">
                        {comp.name}
                      </h4>
                      <span className="inline-flex items-center gap-1 mt-1 bg-brand-50/50 border border-brand-100 text-brand-650 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide">
                        <Tag className="w-2.5 h-2.5 text-brand-400" />
                        <span>{comp.industry}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* SaaS Metrics Table grid */}
                <div className="mt-4.5 space-y-2 text-[10px] text-brand-500 font-sans border-b border-brand-100/50 pb-3.5">
                  
                  {/* Applications submitted */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-brand-400 font-bold uppercase tracking-wider">
                      <Briefcase size={11} />
                      <span>Applications</span>
                    </span>
                    <span className="font-bold text-brand-900 font-mono">
                      {comp.applicationsCount}
                    </span>
                  </div>

                  {/* Open roles */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-brand-400 font-bold uppercase tracking-wider">
                      <TrendingUp size={11} />
                      <span>Open Roles</span>
                    </span>
                    <span className="font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100 font-mono">
                      {comp.openRolesCount} active
                    </span>
                  </div>

                  {/* Average salary */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-brand-400 font-bold uppercase tracking-wider">
                      <DollarSign size={11} />
                      <span>Avg Salary</span>
                    </span>
                    <span className="font-bold text-brand-800 font-mono">
                      {comp.avgSalary}
                    </span>
                  </div>

                  {/* Response rate */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-brand-400 font-bold uppercase tracking-wider">
                      <CheckCircle size={11} />
                      <span>Response Rate</span>
                    </span>
                    <span className="font-bold text-brand-900 font-mono">
                      {comp.responseRate}%
                    </span>
                  </div>

                  {/* Recruiters count */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-brand-400 font-bold uppercase tracking-wider">
                      <Users size={11} />
                      <span>Recruiter Contacts</span>
                    </span>
                    <span className="font-bold text-brand-800 font-mono">
                      {comp.recruiterCount}
                    </span>
                  </div>

                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="mt-4 pt-3 flex items-center justify-between gap-3 text-[11px] font-bold">
                
                {/* View applications */}
                <button
                  onClick={() => {
                    // Navigate to Applications and set the search query to this company
                    navigate("/applications");
                    setTimeout(() => {
                      const searchInput = document.querySelector('input[placeholder*="Search company"]');
                      if (searchInput) {
                        searchInput.value = comp.name;
                        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                      }
                    }, 100);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl transition cursor-pointer"
                >
                  <Eye size={12} />
                  <span>View Apps</span>
                </button>

                {/* Open Website */}
                <a 
                  href={`https://www.${comp.name.toLowerCase()}.com`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 border border-brand-200 hover:bg-brand-50 text-brand-655 rounded-xl transition"
                >
                  <span>Website</span>
                  <ExternalLink size={11} />
                </a>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-brand-200/60 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-premium space-y-5 py-12 mt-8">
          <div className="w-12 h-12 bg-amber-50 rounded-full border border-amber-200 flex items-center justify-center text-amber-500 mx-auto">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-850">No companies match your filters</h3>
            <p className="text-xs text-brand-500 mt-2 max-w-sm mx-auto leading-relaxed">
              We couldn't find any tracked organizations matching your search terms or response rate parameters. Try widening your criteria.
            </p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white font-bold rounded-xl text-xs transition cursor-pointer hover-lift"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
