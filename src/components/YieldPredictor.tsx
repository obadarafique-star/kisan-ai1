import React, { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  ChevronLeft, 
  ChevronRight, 
  Coins, 
  Database, 
  Gauge, 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  ArrowRight,
  Calculator,
  Droplet,
  Settings
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from "recharts";
import { FARM_DATASET, FarmRecord } from "../data/farmDataset";
import { 
  trainModels, 
  predict, 
  getFeatureImportances, 
  CROPS, 
  IRRIGATION_TYPES, 
  SOIL_TYPES, 
  SEASONS,
  MLModel,
  TrainingHistory
} from "../lib/mlEngine";

interface YieldPredictorProps {
  language: string;
}

export default function YieldPredictor({ language }: YieldPredictorProps) {
  // ML Model state
  const [yieldModel, setYieldModel] = useState<MLModel | null>(null);
  const [waterModel, setWaterModel] = useState<MLModel | null>(null);
  const [historyYield, setHistoryYield] = useState<TrainingHistory[]>([]);
  const [historyWater, setHistoryWater] = useState<TrainingHistory[]>([]);
  
  // Custom training parameters
  const [epochs, setEpochs] = useState(600);
  const [lr, setLr] = useState(0.03);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLog, setTrainingLog] = useState<string[]>([]);

  // Form input state
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [selectedSoil, setSelectedSoil] = useState("Silty");
  const [selectedIrrigation, setSelectedIrrigation] = useState("Drip");
  const [selectedSeason, setSelectedSeason] = useState("Zaid");
  const [farmArea, setFarmArea] = useState(150);
  const [fertilizerUsed, setFertilizerUsed] = useState(3.5);
  const [pesticideUsed, setPesticideUsed] = useState(2.2);

  // Prediction output state
  const [predictedYield, setPredictedYield] = useState<number | null>(null);
  const [predictedWater, setPredictedWater] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  
  // Dataset table state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [filterCrop, setFilterCrop] = useState("All");

  // Gemini AI Optimization plan state
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);

  // Active sub-tab state
  const [activeSubTab, setActiveSubTab] = useState<"predictor" | "math" | "dataset">("predictor");

  // Initialize and train models on mount
  useEffect(() => {
    handleTrain(true);
  }, []);

  const handleTrain = (silent = false) => {
    setIsTraining(true);
    const logs: string[] = [];
    
    if (!silent) {
      logs.push("Initializing Multiclass Feature Transformers...");
      logs.push("Encoding string labels (Crops, Soil, Seasons) into 27 discrete binary dimensions...");
      logs.push("Applying Min-Max Normalization to numerical bounds to stabilize gradient scaling...");
    }

    setTimeout(() => {
      try {
        const start = performance.now();
        const results = trainModels(FARM_DATASET, epochs, lr);
        const duration = (performance.now() - start).toFixed(1);

        setYieldModel(results.yieldModel);
        setWaterModel(results.waterModel);
        setHistoryYield(results.historyYield);
        setHistoryWater(results.historyWater);

        if (!silent) {
          logs.push(`Running Stochastic Gradient Descent epochs (total: ${epochs})...`);
          logs.push(`Successfully completed training in ${duration}ms!`);
          logs.push(`Yield Predictor R² accuracy score: ${(results.yieldModel.r2Score * 100).toFixed(1)}%`);
          logs.push(`Water Footprint R² accuracy score: ${(results.waterModel.r2Score * 100).toFixed(1)}%`);
          setTrainingLog(logs);
        }
      } catch (err) {
        console.error("Training failed:", err);
      } finally {
        setIsTraining(false);
      }
    }, silent ? 10 : 600);
  };

  const runPrediction = () => {
    if (!yieldModel || !waterModel) return;
    setIsPredicting(true);
    setAiPlan(null); // Clear old AI advice

    setTimeout(() => {
      const inputs = {
        cropType: selectedCrop,
        farmArea: Number(farmArea),
        irrigationType: selectedIrrigation,
        fertilizerUsed: Number(fertilizerUsed),
        pesticideUsed: Number(pesticideUsed),
        soilType: selectedSoil,
        season: selectedSeason,
      };

      const result = predict(inputs, yieldModel, waterModel);
      setPredictedYield(result.predictedYield);
      setPredictedWater(result.predictedWater);
      setIsPredicting(false);
    }, 250);
  };

  // Generate dynamic Gemini precise agronomist plan based on trained ML prediction
  const getAiOptimizerPlan = async () => {
    if (predictedYield === null || predictedWater === null) return;
    setAiOptimizing(true);
    
    try {
      const prompt = `
        You are an expert AI Precision Agronomist.
        An Indian farmer trained a local Multivariate Linear Regression ML model on regional farm datasets.
        Based on their farm inputs, the ML model calculated these predictions:
        - Crop: ${selectedCrop}
        - Season: ${selectedSeason}
        - Soil Type: ${selectedSoil}
        - Farm Area: ${farmArea} acres
        - Irrigation Mode: ${selectedIrrigation}
        - Chemical Fertilizer Used: ${fertilizerUsed} tons
        - Pesticide Applied: ${pesticideUsed} kg
        
        ML Model Predictions:
        - Predicted Yield: ${predictedYield.toFixed(2)} tons (${(predictedYield / farmArea).toFixed(2)} tons/acre)
        - Predicted Water Footprint: ${predictedWater.toLocaleString(undefined, {maximumFractionDigits:0})} m³ (${(predictedWater / farmArea).toLocaleString(undefined, {maximumFractionDigits:0})} m³/acre)

        Write a precision agronomist optimization report in ${language === "hi" ? "Hindi" : "English"}.
        1. Diagnose if the chemical inputs (fertilizer/pesticide) are too high or low relative to the acres and crop type.
        2. Advise on how to reduce the water usage (cubic meters) by upgrading irrigation mechanisms or improving soil moisture retention.
        3. Provide 3 specific, bulleted actionable modifications to improve the predicted crop yield and farm efficiency.
        
        Format beautifully with clean bullet points and bold titles. Do not include technical model coefficients or developer paths. Focus on real farming!
      `;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          language: language,
        }),
      });

      const resData = await response.json();
      if (resData.success) {
        setAiPlan(resData.reply);
      } else {
        throw new Error(resData.error || "AI could not generate plan.");
      }
    } catch (err) {
      console.error(err);
      setAiPlan(language === "hi" 
        ? "क्षमा करें, AI अनुकूलन रणनीति तैयार करने में असमर्थ था। कृपया पुनः प्रयास करें।" 
        : "Sorry, the AI was unable to generate an optimization plan. Please retry.");
    } finally {
      setAiOptimizing(false);
    }
  };

  // Dataset filtering and pagination
  const filteredRecords = FARM_DATASET.filter((rec) => {
    const matchesQuery = rec.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rec.soilType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rec.farmId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrop = filterCrop === "All" || rec.cropType.toLowerCase() === filterCrop.toLowerCase();
    return matchesQuery && matchesCrop;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Compute dataset metrics for display
  const totalAcreage = FARM_DATASET.reduce((sum, r) => sum + r.farmArea, 0);
  const averageYieldPerAcre = FARM_DATASET.reduce((sum, r) => sum + (r.yield / r.farmArea), 0) / FARM_DATASET.length;
  const averageWaterPerAcre = FARM_DATASET.reduce((sum, r) => sum + (r.waterUsage / r.farmArea), 0) / FARM_DATASET.length;

  return (
    <div id="yield-predictor" className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-black/5 p-6">
      
      {/* Tab Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/60 pb-4 mb-6">
        <div>
          <h2 className="serif text-2xl font-medium text-slate-950 flex items-center gap-2">
            <BrainCircuit className="w-5.5 h-5.5 text-olive animate-pulse" />
            Predictive ML Yield & Footprint Calculator
          </h2>
          <p className="text-xs text-slate-500">
            Train regression algorithms on regional farming datasets to forecast yield output and irrigation water footprint
          </p>
        </div>

        {/* Sub-Tabs selection */}
        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-semibold self-start lg:self-auto">
          <button
            id="ml-subtab-predictor"
            onClick={() => setActiveSubTab("predictor")}
            className={`px-3.5 py-1.5 rounded-full transition ${
              activeSubTab === "predictor" ? "bg-olive text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Predictor & Optimizer
          </button>
          <button
            id="ml-subtab-math"
            onClick={() => setActiveSubTab("math")}
            className={`px-3.5 py-1.5 rounded-full transition ${
              activeSubTab === "math" ? "bg-olive text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Model Math & Retraining
          </button>
          <button
            id="ml-subtab-dataset"
            onClick={() => setActiveSubTab("dataset")}
            className={`px-3.5 py-1.5 rounded-full transition flex items-center gap-1 ${
              activeSubTab === "dataset" ? "bg-olive text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Dataset Explorer
          </button>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeSubTab === "predictor" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left panel: Interactive Simulator Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200/60 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-olive" />
                1. Input Farm Characteristics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Crop Type Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Crop Type:</label>
                  <select
                    id="sim-crop"
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
                  >
                    {CROPS.map((cr) => (
                      <option key={cr} value={cr}>{cr}</option>
                    ))}
                  </select>
                </div>

                {/* Soil Type Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Soil Type:</label>
                  <select
                    id="sim-soil"
                    value={selectedSoil}
                    onChange={(e) => setSelectedSoil(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
                  >
                    {SOIL_TYPES.map((sl) => (
                      <option key={sl} value={sl}>{sl}</option>
                    ))}
                  </select>
                </div>

                {/* Irrigation Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Irrigation Mode:</label>
                  <select
                    id="sim-irrigation"
                    value={selectedIrrigation}
                    onChange={(e) => setSelectedIrrigation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
                  >
                    {IRRIGATION_TYPES.map((irr) => (
                      <option key={irr} value={irr}>{irr}</option>
                    ))}
                  </select>
                </div>

                {/* Season */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Season:</label>
                  <select
                    id="sim-season"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
                  >
                    {SEASONS.map((se) => (
                      <option key={se} value={se}>{se}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sliders for numeric variables */}
              <div className="space-y-3.5 pt-2 border-t border-slate-200/50">
                {/* Farm Area */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-600">Farm Area:</span>
                    <span className="font-mono text-olive font-bold">{farmArea} acres</span>
                  </div>
                  <input
                    id="range-area"
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={farmArea}
                    onChange={(e) => setFarmArea(Number(e.target.value))}
                    className="w-full accent-olive cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>5 acres</span>
                    <span>500 acres</span>
                  </div>
                </div>

                {/* Fertilizer used */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-600">Chemical Fertilizer Amount:</span>
                    <span className="font-mono text-olive font-bold">{fertilizerUsed} tons</span>
                  </div>
                  <input
                    id="range-fertilizer"
                    type="range"
                    min="0.1"
                    max="12.0"
                    step="0.1"
                    value={fertilizerUsed}
                    onChange={(e) => setFertilizerUsed(Number(e.target.value))}
                    className="w-full accent-olive cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.1 tons</span>
                    <span>12.0 tons</span>
                  </div>
                </div>

                {/* Pesticide used */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-600">Pesticide Applied:</span>
                    <span className="font-mono text-olive font-bold">{pesticideUsed} kg</span>
                  </div>
                  <input
                    id="range-pesticide"
                    type="range"
                    min="0.1"
                    max="6.0"
                    step="0.1"
                    value={pesticideUsed}
                    onChange={(e) => setPesticideUsed(Number(e.target.value))}
                    className="w-full accent-olive cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.1 kg</span>
                    <span>6.0 kg</span>
                  </div>
                </div>
              </div>

              <button
                id="btn-run-ml-prediction"
                onClick={runPrediction}
                disabled={isPredicting || !yieldModel}
                className="w-full bg-olive hover:bg-olive/90 text-white font-semibold py-3 rounded-full shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPredicting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running OLS Linear Inference...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Calculate Predicted Yield & Water footprint
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Results and AI Optimizer suggestions (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {predictedYield === null ? (
              <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-200/60 min-h-[400px] flex flex-col items-center justify-center text-center space-y-3">
                <BrainCircuit className="w-12 h-12 text-slate-300" />
                <h4 className="serif text-lg font-medium text-slate-800">Awaiting ML Inference</h4>
                <p className="text-xs text-slate-500 max-w-[280px]">
                  Adjust the farm parameters on the left and trigger the ML calculations to compute model outputs!
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Numerical predictions box */}
                <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200/60 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-olive" />
                    Mathematical Predictions
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Yield Prediction */}
                    <div className="bg-white p-3.5 rounded-xl border border-black/5 shadow-sm space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Expected Yield</span>
                      <p className="text-xl font-extrabold text-slate-900">{predictedYield.toFixed(2)} <span className="text-xs font-medium text-slate-500">tons</span></p>
                      <span className="text-[10px] bg-[#F5F5F0] text-olive font-semibold px-2 py-0.5 rounded mt-1.5 inline-block">
                        {(predictedYield / farmArea).toFixed(3)} tons/acre
                      </span>
                    </div>

                    {/* Water usage prediction */}
                    <div className="bg-white p-3.5 rounded-xl border border-black/5 shadow-sm space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Water Footprint</span>
                      <p className="text-lg font-extrabold text-slate-900 leading-tight">
                        {predictedWater.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-xs font-medium text-slate-500">m³</span>
                      </p>
                      <span className="text-[10px] bg-[#F5F5F0] text-olive font-semibold px-2 py-0.5 rounded mt-1.5 inline-block">
                        {(predictedWater / farmArea).toLocaleString(undefined, {maximumFractionDigits: 0})} m³/acre
                      </span>
                    </div>
                  </div>

                  {/* Efficiency evaluation badge */}
                  <div className="bg-white p-3 rounded-xl border border-black/5 flex items-start gap-2.5">
                    {selectedIrrigation.toLowerCase() === "drip" ? (
                      <div className="p-1.5 bg-[#F5F5F0] text-olive rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {selectedIrrigation.toLowerCase() === "drip" 
                          ? "Highly Resource Efficient" 
                          : "Water Intensity Alert"}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {selectedIrrigation.toLowerCase() === "drip" 
                          ? "Using Drip irrigation maintains a low water footprint coefficient relative to flood or sprinkler models."
                          : "Switching from sprinkler/flood models to modern Drip Irrigation could decrease your predicted water usage by up to 45% based on regression weights."}
                      </p>
                    </div>
                  </div>

                  {/* Optimize input button */}
                  <button
                    id="btn-ask-gemini-optimizer"
                    onClick={getAiOptimizerPlan}
                    disabled={aiOptimizing}
                    className="w-full bg-[#F5F5F0] hover:bg-[#EAEAE0] text-olive font-bold text-xs py-2.5 rounded-full border border-black/5 flex items-center justify-center gap-1.5 transition disabled:opacity-60"
                  >
                    {aiOptimizing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        AI Agronomist analysis...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-olive animate-pulse" />
                        Generate AI Optimization Strategy
                      </>
                    )}
                  </button>
                </div>

                {/* AI Plan text container */}
                {aiPlan && (
                  <div className="bg-olive/5 border border-olive/20 rounded-xl p-5 space-y-3 shadow-[0_4px_12px_rgba(0,0,0,0.01)]">
                    <h4 className="text-xs font-bold text-olive uppercase tracking-wider flex items-center gap-1.5 border-b border-olive/10 pb-2">
                      <Sparkles className="w-4 h-4 text-olive" />
                      Precision Agronomist Advisory Sheet
                    </h4>
                    <div className="text-xs text-slate-700 space-y-2 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto pr-1">
                      {aiPlan}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "math" && (
        <div className="space-y-6">
          
          {/* Controls and Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* OLS Training Controls */}
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200/60 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Settings className="w-4 h-4 text-olive" />
                Solver Configurations
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-600">Training Epochs:</span>
                    <span className="font-mono text-olive font-bold">{epochs}</span>
                  </div>
                  <input
                    id="slider-epochs"
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={epochs}
                    onChange={(e) => setEpochs(Number(e.target.value))}
                    className="w-full accent-olive cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-600">Learning Rate (α):</span>
                    <span className="font-mono text-olive font-bold">{lr}</span>
                  </div>
                  <input
                    id="slider-lr"
                    type="range"
                    min="0.005"
                    max="0.1"
                    step="0.005"
                    value={lr}
                    onChange={(e) => setLr(Number(e.target.value))}
                    className="w-full accent-olive cursor-pointer"
                  />
                </div>
              </div>

              <button
                id="btn-retrain-ml-model"
                onClick={() => handleTrain(false)}
                disabled={isTraining}
                className="w-full bg-olive hover:bg-olive/90 text-white font-semibold py-2 rounded-full text-xs shadow transition flex items-center justify-center gap-1.5"
              >
                {isTraining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                Retrain ML Regressors
              </button>
            </div>

            {/* SGD Training Logs */}
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Stochastic GD Console Logs
              </h3>
              <div className="bg-slate-900 rounded-lg p-3 text-[10px] font-mono text-emerald-400 flex-1 h-[110px] overflow-y-auto space-y-1">
                {trainingLog.length === 0 ? (
                  <p className="text-slate-500">// Ready to train. Tap retrain to view matrix steps.</p>
                ) : (
                  trainingLog.map((log, i) => (
                    <p key={i}>&gt; {log}</p>
                  ))
                )}
              </div>
            </div>

            {/* Accuracy Cards */}
            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200/60 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Model Goodness-Of-Fit
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Yield Predictor (R²)</span>
                    <span className="text-[10px] text-slate-400">Target variance explained</span>
                  </div>
                  <span className="font-mono text-lg font-extrabold text-olive">
                    {yieldModel ? `${(yieldModel.r2Score * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Water Footprint (R²)</span>
                    <span className="text-[10px] text-slate-400">Target variance explained</span>
                  </div>
                  <span className="font-mono text-lg font-extrabold text-olive">
                    {waterModel ? `${(waterModel.r2Score * 100).toFixed(1)}%` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Loss Curves & Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Loss Curves */}
            {historyYield.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-slate-200/60 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  SGD Epoch Convergence (Mean Squared Error Loss)
                </h4>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyYield} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="epoch" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip formatter={(value: any) => [`${Number(value).toFixed(5)}`, "Loss"]} />
                      <Line type="monotone" dataKey="loss" stroke="#5A5A40" strokeWidth={1.8} dot={false} name="Yield MSE" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Feature Importances Bar Chart */}
            {yieldModel && (
              <div className="bg-white rounded-xl p-5 border border-slate-200/60 space-y-3.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Yield Model Normalized Coefficient Importance
                </h4>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getFeatureImportances(yieldModel).slice(0, 8)}
                      margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 8 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="weight" name="Impact Weight" radius={[4, 4, 0, 0]}>
                        {getFeatureImportances(yieldModel).slice(0, 8).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.direction === "positive" ? "#5A5A40" : "#b91c1c"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-[10px] font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-olive rounded" /> Positive Correlation</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-700 rounded" /> Negative Correlation</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "dataset" && (
        <div className="space-y-5">
          {/* Summary widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Training Records</span>
                <span className="text-xl font-extrabold text-slate-900 mt-0.5">{FARM_DATASET.length} rows</span>
              </div>
              <Database className="w-7 h-7 text-slate-300" />
            </div>

            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Yield / Acre</span>
                <span className="text-xl font-extrabold text-slate-900 mt-0.5">{averageYieldPerAcre.toFixed(3)} tons</span>
              </div>
              <TrendingUp className="w-7 h-7 text-olive" />
            </div>

            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Water / Acre</span>
                <span className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {averageWaterPerAcre.toLocaleString(undefined, {maximumFractionDigits: 0})} m³
                </span>
              </div>
              <Droplet className="w-7 h-7 text-olive" />
            </div>
          </div>

          {/* Filtering / Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="search-dataset"
              type="text"
              placeholder="Search by Crop, Soil or Farm ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
            />
            <select
              id="filter-crop"
              value={filterCrop}
              onChange={(e) => {
                setFilterCrop(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
            >
              <option value="All">All Crops</option>
              {CROPS.map((cr) => (
                <option key={cr} value={cr}>{cr}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200/60 text-[10px]">
                    <th className="py-3 px-4">Farm ID</th>
                    <th className="py-3 px-4">Crop Type</th>
                    <th className="py-3 px-4">Area (acres)</th>
                    <th className="py-3 px-4">Soil Type</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4">Irrigation</th>
                    <th className="py-3 px-4">Fertilizer (tons)</th>
                    <th className="py-3 px-4">Pesticide (kg)</th>
                    <th className="py-3 px-4 text-right">Yield (tons)</th>
                    <th className="py-3 px-4 text-right">Water (m³)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        No records matched your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((rec, idx) => (
                      <tr 
                        key={idx} 
                        className="hover:bg-slate-50/50 cursor-pointer"
                        onClick={() => {
                          setSelectedCrop(rec.cropType);
                          setSelectedSoil(rec.soilType);
                          setSelectedIrrigation(rec.irrigationType);
                          setSelectedSeason(rec.season);
                          setFarmArea(rec.farmArea);
                          setFertilizerUsed(rec.fertilizerUsed);
                          setPesticideUsed(rec.pesticideUsed);
                          setActiveSubTab("predictor");
                        }}
                        title="Click to load parameters into Predictor Form"
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{rec.farmId}</td>
                        <td className="py-2.5 px-4 font-medium">{rec.cropType}</td>
                        <td className="py-2.5 px-4">{rec.farmArea}</td>
                        <td className="py-2.5 px-4">{rec.soilType}</td>
                        <td className="py-2.5 px-4">{rec.season}</td>
                        <td className="py-2.5 px-4 font-medium">{rec.irrigationType}</td>
                        <td className="py-2.5 px-4">{rec.fertilizerUsed}</td>
                        <td className="py-2.5 px-4">{rec.pesticideUsed}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">{rec.yield}</td>
                        <td className="py-2.5 px-4 text-right text-slate-500 font-mono">{rec.waterUsage.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                <span className="text-[11px] text-slate-500">
                  Showing page {currentPage} of {totalPages} ({filteredRecords.length} records filtered)
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
