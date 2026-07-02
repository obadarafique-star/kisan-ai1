export type LanguageCode = "en" | "hi" | "mr" | "kn" | "ta" | "te" | "bn";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी" },
  { code: "mr", name: "Marathi", nativeName: "मराठी" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
];

export interface WeatherAdvisory {
  advisory: string;
  irrigationAdvice: string;
  cropAction: string;
  riskLevel: string;
}

export interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  cityName: string;
  advisory?: WeatherAdvisory;
}

export interface MandiMarket {
  name: string;
  price: string;
}

export interface MandiSource {
  title: string;
  uri: string;
}

export interface MandiPriceReport {
  crop: string;
  location: string;
  averagePrice: string;
  priceRange: string;
  trend: "Upward" | "Downward" | "Stable" | string;
  advice: string;
  markets: MandiMarket[];
  sources?: MandiSource[];
}

export interface DiseaseDiagnosis {
  status: "healthy" | "diseased" | "unknown";
  crop: string;
  disease: string;
  confidence: string;
  severity: "Low" | "Medium" | "High";
  reason: string;
  medicine: string;
  fertilizer: string;
  watering: string;
  precautions: string[];
  nextSteps: string;
  image?: string; // base64 representation
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  type: "disease" | "weather" | "mandi" | "chat";
  title: string;
  subtitle: string;
  data: any; // DiseaseDiagnosis | WeatherData | MandiPriceReport | ChatMessage[]
}
