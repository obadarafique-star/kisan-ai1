import React, { useState, useEffect } from "react";
import { 
  Sprout, 
  MapPin, 
  Globe, 
  History, 
  Trash2, 
  BookOpen, 
  FileText, 
  TrendingUp, 
  CloudSun,
  Database,
  CloudLightning,
  Sparkles,
  Award
} from "lucide-react";
import { LANGUAGES, LanguageCode, DiseaseDiagnosis, WeatherData, MandiPriceReport, HistoryItem } from "./types";
import DiseaseDetector from "./components/DiseaseDetector";
import WeatherIntel from "./components/WeatherIntel";
import MandiTracker from "./components/MandiTracker";
import FarmerChatbot from "./components/FarmerChatbot";
import NearbyServicesMap from "./components/NearbyServicesMap";
import YieldPredictor from "./components/YieldPredictor";

export default function App() {
  const [globalLanguage, setGlobalLanguage] = useState<LanguageCode>("en");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"workspace" | "history">("workspace");

  // Load history from localStorage on mount
  useEffect(() => {
    const cachedHistory = localStorage.getItem("kisan_alert_history");
    if (cachedHistory) {
      try {
        setHistory(JSON.parse(cachedHistory));
      } catch (e) {
        console.error("Error loading cached reports:", e);
      }
    }
  }, []);

  const saveToHistory = (type: "disease" | "weather" | "mandi" | "chat", title: string, subtitle: string, data: any) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleString(),
      type,
      title,
      subtitle,
      data,
    };

    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem("kisan_alert_history", JSON.stringify(updated));
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("kisan_alert_history", JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your local agricultural logs and reports?")) {
      setHistory([]);
      localStorage.removeItem("kisan_alert_history");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#2C2C2C] font-sans flex flex-col antialiased">
      {/* Top Navigation Banner */}
      <header className="bg-white text-slate-800 border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-olive rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950 flex items-center gap-1.5">
                Kisan<span className="text-olive">Alert</span>
                <span className="text-[9px] bg-olive text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI Brain
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Multimodal Agronomist & Weather Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selection bar */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-olive" />
              <select
                id="select-global-lang"
                value={globalLanguage}
                onChange={(e) => setGlobalLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((opt) => (
                  <option key={opt.code} value={opt.code} className="bg-white text-slate-800">
                    {opt.nativeName} ({opt.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-semibold">
              <button
                id="tab-btn-workspace"
                onClick={() => setActiveTab("workspace")}
                className={`px-4 py-1.5 rounded-full transition ${
                  activeTab === "workspace" ? "bg-olive text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Farm Board
              </button>
              <button
                id="tab-btn-history"
                onClick={() => setActiveTab("history")}
                className={`px-4 py-1.5 rounded-full transition flex items-center gap-1.5 ${
                  activeTab === "history" ? "bg-olive text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Logs ({history.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Cloud Sync Announcement & Firebase Setup info banner */}
        <div className="bg-white border border-black/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#F5F5F0] text-olive rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Offline-Capable Local Storage Mode Activated</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All crop health, weather advisories, and price reports are cached locally on this device. 
                Need to collaborate or backup to the cloud? Trigger the Firebase integration flow on request!
              </p>
            </div>
          </div>
          <button
            id="btn-trigger-firebase-info"
            onClick={() => alert("To connect Kisan Alert to your Firebase Database, tell the AI Assistant: 'Please set up Firebase for Kisan Alert' in the chat. The assistant will provision persistent Auth & Firestore for you!")}
            className="bg-olive hover:bg-olive/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow transition whitespace-nowrap"
          >
            Connect Cloud Database
          </button>
        </div>

        {activeTab === "workspace" ? (
          <div className="space-y-6">
            
            {/* Top Row: Dual Column Board */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Disease Detector & Weather (7 columns on desktop) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Crop Disease Detection */}
                <DiseaseDetector 
                  language={globalLanguage} 
                  onSaveReport={(report) => {
                    saveToHistory(
                      "disease", 
                      `Crop Diagnosis: ${report.crop}`, 
                      `Condition: ${report.disease} (${report.confidence})`, 
                      report
                    );
                  }}
                />

                {/* 2. Weather Intelligence */}
                <WeatherIntel 
                  language={globalLanguage}
                  onSaveReport={(report) => {
                    saveToHistory(
                      "weather",
                      `Weather Report: ${report.cityName}`,
                      `Temperature: ${report.temperature}°C, Risk: ${report.advisory?.riskLevel || "Low"}`,
                      report
                    );
                  }}
                />
              </div>

              {/* Right Side: Mandi and Chatbot (5 columns on desktop) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 3. Kisan Mitra Chatbot */}
                <FarmerChatbot 
                  language={globalLanguage}
                  onSaveReport={(messages) => {
                    // Find assistant reply to record
                    const lastReply = messages[messages.length - 1];
                    if (lastReply && lastReply.role === "assistant") {
                      saveToHistory(
                        "chat",
                        "AI Advisory Chat",
                        lastReply.content.substring(0, 50) + "...",
                        messages
                      );
                    }
                  }}
                />

                {/* 4. Mandi Price Tracker */}
                <MandiTracker 
                  language={globalLanguage}
                  onSaveReport={(report) => {
                    saveToHistory(
                      "mandi",
                      `Mandi Prices: ${report.crop}`,
                      `State: ${report.location}, Avg: ${report.averagePrice}`,
                      report
                    );
                  }}
                />
              </div>
            </div>

            {/* 5. Predictive ML Yield & Footprint Calculator */}
            <YieldPredictor language={globalLanguage} />

            {/* Bottom Row: Geospatial Services Map (12 columns) */}
            <NearbyServicesMap />
          </div>
        ) : (
          /* Logs / Saved Reports View */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div>
                <h2 className="serif text-3xl font-medium text-slate-900 flex items-center gap-2">
                  <History className="text-olive" />
                  Your Local Farm Logs & Saved Advisories
                </h2>
                <p className="text-xs text-slate-500">Review, print, or analyze all your historically saved AI agronomy reports</p>
              </div>
              {history.length > 0 && (
                <button
                  id="btn-clear-history"
                  onClick={clearAllHistory}
                  className="text-xs text-red-600 font-bold hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Logs
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/5 p-12 text-center max-w-lg mx-auto space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="serif text-2xl font-medium text-slate-800">No Logs Saved Yet</h3>
                <p className="text-xs text-slate-500">
                  Generate a crop diagnosis report, look up weather guidelines, or ask Kisan Mitra questions to populate your log sheet.
                </p>
                <button
                  id="btn-back-board"
                  onClick={() => setActiveTab("workspace")}
                  className="bg-olive hover:bg-olive/90 text-white font-semibold text-xs px-4 py-2 rounded-full shadow transition"
                >
                  Go to Farm Board
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-5 border border-black/5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                          item.type === "disease" ? "bg-red-50 text-red-700 border-red-100" :
                          item.type === "weather" ? "bg-sky-50 text-sky-700 border-sky-100" :
                          item.type === "mandi" ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-purple-50 text-purple-700 border-purple-100"
                        }`}>
                          {item.type} log
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                      </div>

                      <h3 className="font-bold text-slate-800 mt-2.5 text-sm">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>

                      {/* Display a mini representation of the nested data */}
                      <div className="mt-4 bg-[#F5F5F0] rounded-xl p-3 border border-black/5 text-xs">
                        {item.type === "disease" && (
                          <div className="space-y-1.5">
                            {item.data.image && (
                              <img src={item.data.image} alt="Crop" className="w-full h-24 object-cover rounded-lg mb-2" />
                            )}
                            <p><span className="text-slate-400 font-semibold">Diagnosis:</span> <span className="font-bold">{item.data.disease}</span></p>
                            <p><span className="text-slate-400 font-semibold">Treatment:</span> <span className="text-olive font-semibold">{item.data.medicine}</span></p>
                            <p><span className="text-slate-400 font-semibold">Next Step:</span> <span className="text-slate-600 font-medium">{item.data.nextSteps}</span></p>
                          </div>
                        )}
                        {item.type === "weather" && (
                          <div className="space-y-1.5">
                            <p><span className="text-slate-400 font-semibold">Live Temp:</span> <span className="font-bold text-slate-800">{item.data.temperature}°C</span></p>
                            <p><span className="text-slate-400 font-semibold">AI Irrigation Rule:</span> <span className="text-olive font-semibold">{item.data.advisory?.irrigationAdvice}</span></p>
                            <p><span className="text-slate-400 font-semibold">Crop Recommendation:</span> <span className="text-slate-600 font-medium">{item.data.advisory?.cropAction}</span></p>
                          </div>
                        )}
                        {item.type === "mandi" && (
                          <div className="space-y-1.5">
                            <p><span className="text-slate-400 font-semibold">Average Price:</span> <span className="font-bold text-slate-900">{item.data.averagePrice}</span></p>
                            <p><span className="text-slate-400 font-semibold">Mandi Trend:</span> <span className="text-amber-700 font-bold">{item.data.trend}</span></p>
                            <p><span className="text-slate-400 font-semibold">Market Advice:</span> <span className="text-slate-600 leading-relaxed block">{item.data.advice}</span></p>
                          </div>
                        )}
                        {item.type === "chat" && (
                          <div className="space-y-1">
                            <p className="font-bold text-olive flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                              Advisory Response snippet:
                            </p>
                            <p className="text-slate-600 italic">
                              "{item.data[item.data.length - 1]?.content.substring(0, 160)}..."
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        id={`btn-del-item-${item.id}`}
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Humble craft footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="flex items-center gap-1">
            Kisan Alert © 2026 • Crafted for Smart Agriculture & High Density Design Theme
          </p>
          <p className="font-mono text-[10px]">
            Connected with Google GenAI SDK (Gemini 3.5 Flash)
          </p>
        </div>
      </footer>
    </div>
  );
}
