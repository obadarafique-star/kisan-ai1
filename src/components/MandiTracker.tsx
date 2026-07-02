import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Info, Search, RefreshCw, AlertCircle, ExternalLink, Award } from "lucide-react";
import { MandiPriceReport, LanguageCode } from "../types";

interface MandiTrackerProps {
  language: LanguageCode;
  onSaveReport: (report: MandiPriceReport) => void;
}

export default function MandiTracker({ language, onSaveReport }: MandiTrackerProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MandiPriceReport | null>(null);
  const [cropInput, setCropInput] = useState("Tomato");
  const [locationInput, setLocationInput] = useState("Maharashtra");
  const [errorMsg, setErrorMsg] = useState("");

  const commonCrops = [
    { name: "Tomato", hindi: "टमाटर" },
    { name: "Onion", hindi: "प्याज़" },
    { name: "Potato", hindi: "आलू" },
    { name: "Wheat", hindi: "गेहूं" },
    { name: "Rice / Paddy", hindi: "चावल / धान" },
    { name: "Cotton", hindi: "कपास" },
  ];

  const commonStates = [
    "Maharashtra",
    "Karnataka",
    "Uttar Pradesh",
    "Punjab",
    "Madhya Pradesh",
    "Andhra Pradesh",
    "Tamil Nadu",
  ];

  const fetchMandiPrices = async (crop: string, location: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/mandi?crop=${encodeURIComponent(crop)}&location=${encodeURIComponent(location)}`);
      const data = await response.json();
      if (data.success) {
        const fullReport: MandiPriceReport = {
          crop: data.data.crop,
          location: data.data.location,
          averagePrice: data.data.averagePrice,
          priceRange: data.data.priceRange,
          trend: data.data.trend,
          advice: data.data.advice,
          markets: data.data.markets,
          sources: data.sources,
        };
        setReport(fullReport);
        onSaveReport(fullReport);
      } else {
        setErrorMsg(data.error || "Failed to load mandi prices.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to Mandi intelligence network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandiPrices("Tomato", "Maharashtra");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropInput.trim() || !locationInput.trim()) return;
    fetchMandiPrices(cropInput, locationInput);
  };

  const getTrendIcon = (trend: string) => {
    const lower = (trend || "").toLowerCase();
    if (lower.includes("up") || lower.includes("rise")) {
      return <TrendingUp className="w-5 h-5 text-olive" />;
    }
    if (lower.includes("down") || lower.includes("fall")) {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
    return <Minus className="w-5 h-5 text-slate-500" />;
  };

  const getTrendBadgeColor = (trend: string) => {
    const lower = (trend || "").toLowerCase();
    if (lower.includes("up") || lower.includes("rise")) {
      return "bg-[#F5F5F0] text-olive border-slate-200";
    }
    if (lower.includes("down") || lower.includes("fall")) {
      return "bg-red-50 text-red-700 border-red-100";
    }
    return "bg-slate-50 text-slate-700 border-slate-100";
  };

  return (
    <div id="mandi-tracker" className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-black/5 p-6">
      <div className="mb-4">
        <h2 className="serif text-2xl font-medium text-slate-950 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-olive animate-pulse" />
          Mandi Price Tracker & Market Intelligence
        </h2>
        <p className="text-xs text-slate-500">
          Real-time market rates and AI-powered recommendations on the best times to sell your harvest
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search controls */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Select or Type Crop:</label>
              <div className="relative">
                <input
                  id="input-crop-mandi"
                  type="text"
                  placeholder="e.g. Tomato, Cotton, Wheat..."
                  value={cropInput}
                  onChange={(e) => setCropInput(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
                />
                <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Select State/Region:</label>
              <select
                id="select-state-mandi"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
              >
                {commonStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-mandi-search"
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-full text-xs transition shadow-sm flex items-center justify-center gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Fetch Live Market Prices
            </button>
          </form>

          {/* Quick crops selector */}
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">Popular Harvest Crops:</span>
            <div className="grid grid-cols-2 gap-2">
              {commonCrops.map((c) => (
                <button
                  key={c.name}
                  id={`btn-crop-${c.name.toLowerCase().replace(/\//g, "-").trim()}`}
                  onClick={() => {
                    setCropInput(c.name);
                    fetchMandiPrices(c.name, locationInput);
                  }}
                  className={`text-left text-xs px-3 py-2 rounded-xl border transition flex items-center justify-between ${
                    cropInput.toLowerCase() === c.name.toLowerCase()
                      ? "bg-olive border-olive text-white font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{c.name}</span>
                  <span className={`text-[10px] font-normal ${cropInput.toLowerCase() === c.name.toLowerCase() ? "text-slate-200" : "text-slate-400"}`}>{c.hindi}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price statistics card */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-10 h-10 text-olive animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-800">Searching APMC Market Grounding...</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Gemini is executing Live Web Grounding to scrape active price ledgers across APMC mandi networks...
              </p>
            </div>
          ) : report ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stat panel: Averages */}
              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Crop & Location</span>
                  <h3 className="text-base font-bold text-slate-800 mt-0.5">{report.crop}</h3>
                  <p className="text-xs text-slate-500">{report.location} markets</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Market Average</span>
                  <p className="text-xl font-extrabold text-slate-950 mt-0.5">{report.averagePrice}</p>
                </div>
              </div>

              {/* Stat panel: Range */}
              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Price Band (Min-Max)</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{report.priceRange}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Market Trend</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${getTrendBadgeColor(report.trend)}`}>
                      {getTrendIcon(report.trend)}
                      {report.trend}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat panel: Gemini Recommendation */}
              <div className="bg-[#F5F5F0] text-slate-900 rounded-xl p-4 border border-black/5 flex flex-col justify-between md:col-span-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-olive flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    AI Selling Recommendation
                  </span>
                  <p className="text-xs font-medium text-slate-800 mt-2 leading-relaxed">
                    {report.advice}
                  </p>
                </div>
              </div>

              {/* Mandi pricing list */}
              <div className="md:col-span-3 bg-white border border-black/5 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Prices in Nearby APMC Markets</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="pb-2 font-semibold">Mandi Market Name</th>
                        <th className="pb-2 text-right font-semibold">Price per Quintal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.markets && report.markets.length > 0 ? (
                        report.markets.map((m, idx) => (
                           <tr key={idx} className="text-slate-700">
                            <td className="py-2.5 font-medium">{m.name}</td>
                            <td className="py-2.5 text-right font-bold text-slate-900">{m.price}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-slate-400">
                            No market breakdown available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grounding citations */}
              {report.sources && report.sources.length > 0 && (
                <div className="md:col-span-3 bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 flex flex-wrap items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-olive" />
                    Verified Sources:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {report.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-[10px] bg-white border border-slate-200 text-slate-600 hover:text-olive hover:border-olive/40 px-2 py-1 rounded flex items-center gap-1 transition"
                      >
                        {s.title.substring(0, 20)}...
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-xl border border-slate-200/60 p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
              <TrendingUp className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Awaiting Price Request</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Search for a crop to view active APMC market price indices.
              </p>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
