import React, { useState, useRef, useEffect } from "react";
import { Upload, Camera, Mic, Volume2, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, VolumeX } from "lucide-react";
import { DiseaseDiagnosis, LanguageCode } from "../types";

interface DiseaseDetectorProps {
  language: LanguageCode;
  onSaveReport: (report: DiseaseDiagnosis) => void;
}

export default function DiseaseDetector({ language, onSaveReport }: DiseaseDetectorProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiseaseDiagnosis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  // Speech recognition
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API for transcription
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "en" ? "en-US" : 
               language === "hi" ? "hi-IN" : 
               language === "mr" ? "mr-IN" : 
               language === "kn" ? "kn-IN" : 
               language === "ta" ? "ta-IN" : 
               language === "te" ? "te-IN" : "bn-IN";
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => prev ? `${prev} ${transcript}` : transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }

    return () => {
      stopCamera();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Voice output using Web Speech Synthesis
  const speakReport = () => {
    if (!diagnosis || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${diagnosis.crop}. ${diagnosis.disease}. Severity: ${diagnosis.severity}. Reason: ${diagnosis.reason}. Treatment: ${diagnosis.medicine}. Next step: ${diagnosis.nextSteps}`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Choose voice matching the language
    const langCode = language === "en" ? "en-US" : 
                    language === "hi" ? "hi-IN" : 
                    language === "mr" ? "mr-IN" : 
                    language === "kn" ? "kn-IN" : 
                    language === "ta" ? "ta-IN" : 
                    language === "te" ? "te-IN" : "bn-IN";
    utterance.lang = langCode;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDiagnosis(null);
        setErrorMessage("");
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Actions
  const startCamera = async () => {
    setShowCamera(true);
    setDiagnosis(null);
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMessage("Could not open camera. Please ensure permissions are granted.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setSelectedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Speech Recognition control
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not fully supported in this browser. Please type descriptions manually.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Call Server-side vision diagnosis
  const analyzeCropImage = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setErrorMessage("");
    setDiagnosis(null);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const response = await fetch("/api/disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          description: description,
          language: language === "hi" ? "Hindi" : 
                    language === "mr" ? "Marathi" : 
                    language === "kn" ? "Kannada" : 
                    language === "ta" ? "Tamil" : 
                    language === "te" ? "Telugu" : 
                    language === "bn" ? "Bengali" : "English"
        }),
      });

      const data = await response.json();
      if (data.success) {
        const fullDiagnosis = { ...data.result, image: selectedImage };
        setDiagnosis(fullDiagnosis);
        onSaveReport(fullDiagnosis);
      } else {
        setErrorMessage(data.error || "Failed to analyze crop image.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Connection error. Ensure your Gemini API Key is set up correctly in Secrets.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="disease-detector" className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-black/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="serif text-2xl font-medium text-slate-950 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-olive animate-pulse" />
            AI Disease & Pest Detection
          </h2>
          <p className="text-xs text-slate-500">
            Upload or capture plant photos to get immediate treatments and remedies
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left pane: Upload / Camera */}
        <div className="space-y-4">
          <div className="relative border border-dashed border-slate-300 hover:border-olive rounded-xl overflow-hidden bg-slate-50/50 flex flex-col items-center justify-center min-h-[300px] transition duration-200">
            {showCamera ? (
              <div className="absolute inset-0 flex flex-col bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                  <button
                    id="btn-capture"
                    onClick={capturePhoto}
                    className="bg-olive hover:bg-olive/90 text-white rounded-full p-4 shadow-lg transition"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <button
                    id="btn-cancel-cam"
                    onClick={stopCamera}
                    className="bg-slate-800 hover:bg-slate-700 text-white rounded-full px-4 py-2 text-sm shadow transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedImage ? (
              <div className="relative w-full h-full min-h-[300px]">
                <img src={selectedImage} alt="Crop Upload" className="w-full h-[300px] object-cover" />
                <button
                  id="btn-clear-img"
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-full text-xs shadow-md backdrop-blur-sm transition"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-slate-700">Drag & drop your crop image here</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">JPEG, PNG up to 10MB</p>
                <div className="flex gap-3">
                  <label className="bg-[#F5F5F0] hover:bg-[#EAEAE0] text-olive font-bold text-xs px-4 py-2.5 rounded-full cursor-pointer transition">
                    Browse File
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <button
                    id="btn-start-camera"
                    onClick={startCamera}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2.5 rounded-full flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Take Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prompt/Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 block">Describe Symptoms (Optional):</label>
            <div className="relative">
              <input
                id="input-symptom-desc"
                type="text"
                placeholder="e.g. Yellow spots on leaves, holes in stem..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-olive/10 focus:border-olive"
              />
              <button
                id="btn-mic-desc"
                onClick={toggleRecording}
                className={`absolute right-2 top-2 p-1 rounded-lg transition ${
                  isRecording ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:bg-slate-100"
                }`}
                title="Speak description"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            {isRecording && <p className="text-xs text-red-500 animate-pulse">Listening... Speak now</p>}
          </div>

          <button
            id="btn-analyze-disease"
            onClick={analyzeCropImage}
            disabled={!selectedImage || isLoading}
            className="w-full bg-olive hover:bg-olive/90 text-white font-semibold py-3 rounded-full shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing with Gemini Multimodal AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Diagnose Crop Disease
              </>
            )}
          </button>

          {errorMessage && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right pane: Results */}
        <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200/60 min-h-[300px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <RefreshCw className="w-10 h-10 text-olive animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-800">Processing Multimodal Payload</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Gemini Vision AI is identifying plant types, spots, defects, and consulting crop remedies...
              </p>
            </div>
          ) : diagnosis ? (
            <div className="space-y-4 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Identified Crop</span>
                  <h3 className="text-lg font-bold text-slate-800">{diagnosis.crop}</h3>
                </div>
                <button
                  id="btn-speak-report"
                  onClick={speakReport}
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition shadow-sm ${
                    isSpeaking 
                      ? "bg-olive border-olive text-white animate-pulse" 
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {isSpeaking ? "Stop Voice" : "Voice Readout"}
                </button>
              </div>

              <div className="border-t border-slate-200/60 my-2" />

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Condition / Disease</span>
                  <span className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    {diagnosis.status === "healthy" ? (
                      <CheckCircle2 className="w-5 h-5 text-olive" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                    {diagnosis.disease}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Confidence</span>
                  <span className="text-sm font-bold text-slate-800">{diagnosis.confidence}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1 bg-white p-3 rounded-xl border border-black/5">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Severity</span>
                  <span className={`text-xs font-semibold inline-block px-2.5 py-0.5 rounded-full mt-0.5 ${
                    diagnosis.severity === "High" ? "bg-red-50 text-red-700 border border-red-100" :
                    diagnosis.severity === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    "bg-[#F5F5F0] text-olive border border-slate-200"
                  }`}>
                    {diagnosis.severity} Severity
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Watering Recommendation</span>
                  <span className="text-xs font-medium text-slate-700 mt-1 block">{diagnosis.watering}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Diagnosis Reason</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-black/5">
                  {diagnosis.reason}
                </p>
              </div>

              {diagnosis.status !== "healthy" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-olive uppercase block">Recommended Treatment</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">{diagnosis.medicine}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">Fertilizer Advice</span>
                    <p className="text-xs font-bold text-slate-900 mt-1">{diagnosis.fertilizer}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Precautions & Preventative Actions</h4>
                <ul className="list-disc list-inside space-y-1 bg-white p-3 rounded-xl border border-black/5">
                  {diagnosis.precautions.map((prec, idx) => (
                    <li key={idx} className="text-xs text-slate-600">{prec}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#F5F5F0] border border-black/5 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Actionable Next Step</span>
                <p className="text-xs font-semibold text-slate-800 mt-1 leading-relaxed">
                  {diagnosis.nextSteps}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Upload className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Awaiting Diagnosis</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Submit an image with symptoms to generate an AI-powered diagnostic advisory card.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
