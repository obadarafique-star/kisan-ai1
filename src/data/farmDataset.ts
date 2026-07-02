export interface FarmRecord {
  farmId: string;
  cropType: string;
  farmArea: number; // acres
  irrigationType: string;
  fertilizerUsed: number; // tons
  pesticideUsed: number; // kg
  yield: number; // tons
  soilType: string;
  season: string;
  waterUsage: number; // cubic meters
}

export const FARM_DATASET: FarmRecord[] = [
  { farmId: "F001", cropType: "Cotton", farmArea: 329.4, irrigationType: "Sprinkler", fertilizerUsed: 8.14, pesticideUsed: 2.21, yield: 14.44, soilType: "Loamy", season: "Kharif", waterUsage: 76648.2 },
  { farmId: "F002", cropType: "Carrot", farmArea: 18.67, irrigationType: "Manual", fertilizerUsed: 4.77, pesticideUsed: 4.36, yield: 42.91, soilType: "Peaty", season: "Kharif", waterUsage: 68725.54 },
  { farmId: "F003", cropType: "Sugarcane", farmArea: 306.03, irrigationType: "Flood", fertilizerUsed: 2.91, pesticideUsed: 0.56, yield: 33.44, soilType: "Silty", season: "Kharif", waterUsage: 75538.56 },
  { farmId: "F004", cropType: "Tomato", farmArea: 380.21, irrigationType: "Rain-fed", fertilizerUsed: 3.32, pesticideUsed: 4.35, yield: 34.08, soilType: "Silty", season: "Zaid", waterUsage: 45401.23 },
  { farmId: "F005", cropType: "Tomato", farmArea: 135.56, irrigationType: "Sprinkler", fertilizerUsed: 8.33, pesticideUsed: 4.48, yield: 43.28, soilType: "Clay", season: "Zaid", waterUsage: 93718.69 },
  { farmId: "F006", cropType: "Sugarcane", farmArea: 12.5, irrigationType: "Sprinkler", fertilizerUsed: 6.42, pesticideUsed: 2.25, yield: 38.18, soilType: "Loamy", season: "Zaid", waterUsage: 46487.98 },
  { farmId: "F007", cropType: "Soybean", farmArea: 360.06, irrigationType: "Drip", fertilizerUsed: 1.83, pesticideUsed: 2.37, yield: 44.93, soilType: "Sandy", season: "Rabi", waterUsage: 40583.57 },
  { farmId: "F008", cropType: "Rice", farmArea: 464.6, irrigationType: "Drip", fertilizerUsed: 5.18, pesticideUsed: 0.91, yield: 4.23, soilType: "Silty", season: "Kharif", waterUsage: 9392.38 },
  { farmId: "F009", cropType: "Maize", farmArea: 389.37, irrigationType: "Drip", fertilizerUsed: 0.57, pesticideUsed: 4.93, yield: 3.86, soilType: "Peaty", season: "Rabi", waterUsage: 60202.14 },
  { farmId: "F010", cropType: "Soybean", farmArea: 184.37, irrigationType: "Drip", fertilizerUsed: 2.18, pesticideUsed: 2.67, yield: 17.25, soilType: "Sandy", season: "Kharif", waterUsage: 90922.15 },
  { farmId: "F011", cropType: "Rice", farmArea: 279.95, irrigationType: "Drip", fertilizerUsed: 8.02, pesticideUsed: 1.24, yield: 32.85, soilType: "Clay", season: "Zaid", waterUsage: 5869.75 },
  { farmId: "F012", cropType: "Sugarcane", farmArea: 145.32, irrigationType: "Flood", fertilizerUsed: 3.01, pesticideUsed: 2.27, yield: 8.08, soilType: "Clay", season: "Kharif", waterUsage: 88976.51 },
  { farmId: "F013", cropType: "Wheat", farmArea: 329.1, irrigationType: "Drip", fertilizerUsed: 5.26, pesticideUsed: 0.83, yield: 5.44, soilType: "Clay", season: "Zaid", waterUsage: 45922.35 },
  { farmId: "F014", cropType: "Rice", farmArea: 246.02, irrigationType: "Flood", fertilizerUsed: 1.01, pesticideUsed: 3.45, yield: 11.38, soilType: "Sandy", season: "Rabi", waterUsage: 71953.14 },
  { farmId: "F015", cropType: "Sugarcane", farmArea: 305.15, irrigationType: "Rain-fed", fertilizerUsed: 5.39, pesticideUsed: 2.15, yield: 28.77, soilType: "Peaty", season: "Kharif", waterUsage: 33615.77 },
  { farmId: "F016", cropType: "Barley", farmArea: 60.22, irrigationType: "Flood", fertilizerUsed: 2.19, pesticideUsed: 0.35, yield: 16.03, soilType: "Sandy", season: "Zaid", waterUsage: 25132.48 },
  { farmId: "F017", cropType: "Carrot", farmArea: 284.01, irrigationType: "Manual", fertilizerUsed: 5.89, pesticideUsed: 0.81, yield: 47.7, soilType: "Loamy", season: "Zaid", waterUsage: 88301.46 },
  { farmId: "F018", cropType: "Maize", farmArea: 128.23, irrigationType: "Rain-fed", fertilizerUsed: 4.91, pesticideUsed: 0.77, yield: 16.67, soilType: "Loamy", season: "Rabi", waterUsage: 18660.03 },
  { farmId: "F019", cropType: "Maize", farmArea: 460.93, irrigationType: "Drip", fertilizerUsed: 1.09, pesticideUsed: 1.31, yield: 39.96, soilType: "Sandy", season: "Zaid", waterUsage: 54314.28 },
  { farmId: "F020", cropType: "Barley", farmArea: 58.85, irrigationType: "Sprinkler", fertilizerUsed: 3.61, pesticideUsed: 3.32, yield: 18.85, soilType: "Sandy", season: "Kharif", waterUsage: 92481.89 },
  { farmId: "F021", cropType: "Cotton", farmArea: 377.05, irrigationType: "Drip", fertilizerUsed: 5.95, pesticideUsed: 0.91, yield: 29.17, soilType: "Clay", season: "Rabi", waterUsage: 26743.55 },
  { farmId: "F022", cropType: "Wheat", farmArea: 92.67, irrigationType: "Flood", fertilizerUsed: 6.95, pesticideUsed: 3.64, yield: 30.7, soilType: "Clay", season: "Rabi", waterUsage: 42874.34 },
  { farmId: "F023", cropType: "Potato", farmArea: 15.67, irrigationType: "Drip", fertilizerUsed: 9.95, pesticideUsed: 2.99, yield: 18.13, soilType: "Loamy", season: "Zaid", waterUsage: 41862.86 },
  { farmId: "F024", cropType: "Rice", farmArea: 483.88, irrigationType: "Drip", fertilizerUsed: 6.31, pesticideUsed: 2.29, yield: 34.46, soilType: "Clay", season: "Zaid", waterUsage: 61383.07 },
  { farmId: "F025", cropType: "Barley", farmArea: 75.64, irrigationType: "Flood", fertilizerUsed: 6.69, pesticideUsed: 3.57, yield: 6.14, soilType: "Silty", season: "Zaid", waterUsage: 43847.82 },
  { farmId: "F026", cropType: "Wheat", farmArea: 162.28, irrigationType: "Flood", fertilizerUsed: 5.85, pesticideUsed: 2.42, yield: 24.63, soilType: "Loamy", season: "Rabi", waterUsage: 65838.4 },
  { farmId: "F027", cropType: "Cotton", farmArea: 375.1, irrigationType: "Rain-fed", fertilizerUsed: 0.5, pesticideUsed: 4.76, yield: 22.51, soilType: "Clay", season: "Kharif", waterUsage: 39362.44 },
  { farmId: "F028", cropType: "Tomato", farmArea: 256.19, irrigationType: "Flood", fertilizerUsed: 7.32, pesticideUsed: 2.19, yield: 48.02, soilType: "Silty", season: "Rabi", waterUsage: 81313.04 },
  { farmId: "F029", cropType: "Wheat", farmArea: 288.52, irrigationType: "Manual", fertilizerUsed: 1.79, pesticideUsed: 4.78, yield: 36.9, soilType: "Silty", season: "Zaid", waterUsage: 23208.04 },
  { farmId: "F030", cropType: "Potato", farmArea: 286.52, irrigationType: "Rain-fed", fertilizerUsed: 8.91, pesticideUsed: 0.77, yield: 30.5, soilType: "Loamy", season: "Zaid", waterUsage: 93407.38 },
  { farmId: "F031", cropType: "Barley", farmArea: 136.16, irrigationType: "Flood", fertilizerUsed: 5.89, pesticideUsed: 1.36, yield: 11.86, soilType: "Clay", season: "Zaid", waterUsage: 30098.35 },
  { farmId: "F032", cropType: "Carrot", farmArea: 350.42, irrigationType: "Flood", fertilizerUsed: 8.4, pesticideUsed: 2.94, yield: 24.34, soilType: "Clay", season: "Rabi", waterUsage: 71580.87 },
  { farmId: "F033", cropType: "Barley", farmArea: 446.76, irrigationType: "Drip", fertilizerUsed: 7.79, pesticideUsed: 0.96, yield: 46.47, soilType: "Loamy", season: "Zaid", waterUsage: 93656.06 },
  { farmId: "F034", cropType: "Tomato", farmArea: 264.12, irrigationType: "Drip", fertilizerUsed: 4.75, pesticideUsed: 4.79, yield: 12.92, soilType: "Loamy", season: "Rabi", waterUsage: 92745.01 },
  { farmId: "F035", cropType: "Soybean", farmArea: 266.03, irrigationType: "Drip", fertilizerUsed: 8.57, pesticideUsed: 1.35, yield: 34.45, soilType: "Silty", season: "Zaid", waterUsage: 43610.21 },
  { farmId: "F036", cropType: "Cotton", farmArea: 446.16, irrigationType: "Manual", fertilizerUsed: 4.35, pesticideUsed: 3.47, yield: 12.53, soilType: "Loamy", season: "Zaid", waterUsage: 38874.28 },
  { farmId: "F037", cropType: "Soybean", farmArea: 156.1, irrigationType: "Manual", fertilizerUsed: 1.18, pesticideUsed: 4.43, yield: 40.15, soilType: "Loamy", season: "Zaid", waterUsage: 73646.55 },
  { farmId: "F038", cropType: "Barley", farmArea: 431.22, irrigationType: "Drip", fertilizerUsed: 5.71, pesticideUsed: 3.18, yield: 45.95, soilType: "Silty", season: "Kharif", waterUsage: 36065.94 },
  { farmId: "F039", cropType: "Cotton", farmArea: 220.48, irrigationType: "Flood", fertilizerUsed: 9.96, pesticideUsed: 2.91, yield: 10.53, soilType: "Clay", season: "Zaid", waterUsage: 82549.03 },
  { farmId: "F040", cropType: "Cotton", farmArea: 166.82, irrigationType: "Rain-fed", fertilizerUsed: 2.85, pesticideUsed: 1.36, yield: 46.19, soilType: "Sandy", season: "Zaid", waterUsage: 12007.7 },
  { farmId: "F041", cropType: "Rice", farmArea: 370.79, irrigationType: "Flood", fertilizerUsed: 8.18, pesticideUsed: 4.99, yield: 35.01, soilType: "Sandy", season: "Kharif", waterUsage: 85208.71 },
  { farmId: "F042", cropType: "Sugarcane", farmArea: 418.99, irrigationType: "Sprinkler", fertilizerUsed: 0.78, pesticideUsed: 0.58, yield: 26.29, soilType: "Clay", season: "Zaid", waterUsage: 33705.69 },
  { farmId: "F043", cropType: "Cotton", farmArea: 78.79, irrigationType: "Flood", fertilizerUsed: 1.35, pesticideUsed: 3.0, yield: 11.45, soilType: "Sandy", season: "Zaid", waterUsage: 94754.73 },
  { farmId: "F044", cropType: "Soybean", farmArea: 84.12, irrigationType: "Manual", fertilizerUsed: 4.64, pesticideUsed: 2.53, yield: 24.77, soilType: "Sandy", season: "Rabi", waterUsage: 40614.4 },
  { farmId: "F045", cropType: "Tomato", farmArea: 326.69, irrigationType: "Sprinkler", fertilizerUsed: 5.24, pesticideUsed: 0.55, yield: 18.34, soilType: "Peaty", season: "Kharif", waterUsage: 37466.11 },
  { farmId: "F046", cropType: "Carrot", farmArea: 112.8, irrigationType: "Sprinkler", fertilizerUsed: 1.8, pesticideUsed: 1.01, yield: 31.57, soilType: "Clay", season: "Kharif", waterUsage: 79966.1 },
  { farmId: "F047", cropType: "Potato", farmArea: 347.66, irrigationType: "Drip", fertilizerUsed: 3.86, pesticideUsed: 2.68, yield: 31.47, soilType: "Sandy", season: "Kharif", waterUsage: 86989.88 },
  { farmId: "F048", cropType: "Potato", farmArea: 77.39, irrigationType: "Sprinkler", fertilizerUsed: 9.34, pesticideUsed: 3.0, yield: 20.53, soilType: "Silty", season: "Zaid", waterUsage: 5874.17 },
  { farmId: "F049", cropType: "Barley", farmArea: 462.37, irrigationType: "Sprinkler", fertilizerUsed: 2.3, pesticideUsed: 0.14, yield: 39.51, soilType: "Clay", season: "Kharif", waterUsage: 53879.87 },
  { farmId: "F050", cropType: "Tomato", farmArea: 292.25, irrigationType: "Rain-fed", fertilizerUsed: 4.08, pesticideUsed: 0.76, yield: 45.14, soilType: "Silty", season: "Kharif", waterUsage: 90232.08 }
];
