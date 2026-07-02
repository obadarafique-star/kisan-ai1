import React, { useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { MapPin, Info, Phone, Compass, Plus, Sparkles } from "lucide-react";

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

interface ServicePlace {
  id: string;
  name: string;
  type: "kendra" | "fertilizer" | "mandi" | "lab";
  typeName: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  hours: string;
}

const mockPlaces: ServicePlace[] = [
  {
    id: "kendra-1",
    name: "Krishi Vigyan Kendra (KVK) - Nashik Hub",
    type: "kendra",
    typeName: "Govt Agriculture Center",
    lat: 19.9975,
    lng: 73.7898,
    address: "Pimpalgaon Baswant, Nashik, Maharashtra 422209",
    phone: "+91 253 2530124",
    hours: "09:00 AM - 05:00 PM (Closed Sunday)",
  },
  {
    id: "fertilizer-1",
    name: "Jai Kisan Seed & Fertilizer Depot",
    type: "fertilizer",
    typeName: "Fertilizer & Pesticides Shop",
    lat: 20.0120,
    lng: 73.7950,
    address: "Main Market Road, Pimpalgaon, Nashik 422209",
    phone: "+91 98220 14523",
    hours: "08:00 AM - 08:00 PM (Open Daily)",
  },
  {
    id: "mandi-1",
    name: "Pimpalgaon Grapes & Onion APMC Mandi",
    type: "mandi",
    typeName: "Mandi Market",
    lat: 19.9850,
    lng: 73.7750,
    address: "National Highway 3, Pimpalgaon Baswant, Maharashtra 422209",
    phone: "+91 253 2580456",
    hours: "04:00 AM - 02:00 PM",
  },
  {
    id: "lab-1",
    name: "Saraswati Soil Testing & Fertilizer Lab",
    type: "lab",
    typeName: "Soil Testing Laboratory",
    lat: 19.9920,
    lng: 73.8120,
    address: "Opposite Panchayat Samiti, Nashik Road, Maharashtra 422003",
    phone: "+91 94222 89451",
    hours: "10:00 AM - 06:00 PM (Closed Sunday)",
  },
];

export default function NearbyServicesMap() {
  const [center, setCenter] = useState({ lat: 19.9975, lng: 73.7898 }); // default Nashik
  const [zoom, setZoom] = useState(13);
  const [selectedPlace, setSelectedPlace] = useState<ServicePlace | null>(null);

  // If the user hasn't added their Google Maps API Key yet, render a beautiful splash screen
  // explaining exactly how they can configure it in Google AI Studio to unlock full maps.
  if (!hasValidKey) {
    return (
      <div id="maps-splash-screen" className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-black/5 p-6 min-h-[460px] flex flex-col items-center justify-center text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto text-olive border border-black/5">
            <Compass className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="serif text-lg font-medium text-slate-950">Google Maps Integration Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Unlocking the Geospatial Dashboard allows you to find nearby fertilizer outlets, soil research labs, government Krishi Kendras, and mandis.
          </p>

          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-left text-xs space-y-2">
            <p className="font-bold text-slate-700">How to activate Google Maps in AI Studio:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>
                <a 
                  href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-olive font-bold underline hover:text-olive/80"
                >
                  Get an API Key from Google Cloud Console
                </a>
              </li>
              <li>
                Open the **Settings** (⚙️ gear icon, top-right corner of AI Studio)
              </li>
              <li>Select **Secrets**</li>
              <li>
                Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as secret name, press Enter
              </li>
              <li>Paste your API key value, press Enter</li>
            </ol>
            <p className="text-[10px] text-amber-600 font-medium pt-1">
              ⚠️ The app will automatically rebuild after adding the secret - no browser reload needed!
            </p>
          </div>

          <div className="pt-2">
            <button
              id="btn-maps-bypass"
              onClick={() => {
                // Pre-activate mock interactive list view for demonstration if they bypass
                alert("This option acts as a placeholder. Setting the GOOGLE_MAPS_PLATFORM_KEY secret is required to unlock the live map view.");
              }}
              className="bg-olive hover:bg-olive/90 text-white font-bold text-xs px-5 py-2 rounded-full transition"
            >
              Continue to Local Outlets Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getPinColor = (type: string) => {
    switch (type) {
      case "kendra": return "#808000"; // olive green
      case "fertilizer": return "#3b82f6"; // blue
      case "mandi": return "#f59e0b"; // amber
      case "lab": return "#8b5cf6"; // purple
      default: return "#64748b";
    }
  };

  return (
    <div id="nearby-services-map" className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] border border-black/5 p-6">
      <div className="mb-4">
        <h2 className="serif text-2xl font-medium text-slate-950 flex items-center gap-2">
          <Compass className="w-5 h-5 text-olive animate-pulse" />
          Geospatial Krishi Locator & Services Map
        </h2>
        <p className="text-xs text-slate-500">
          Find government centers, fertilizer dealers, crop insurance offices, and mandis near you
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outlets Directory list */}
        <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Agricultural Services Directories</span>
          
          <div className="space-y-2.5">
            {mockPlaces.map((place) => (
              <button
                key={place.id}
                id={`btn-place-${place.id}`}
                onClick={() => {
                  setCenter({ lat: place.lat, lng: place.lng });
                  setZoom(15);
                  setSelectedPlace(place);
                }}
                className={`w-full text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                  selectedPlace?.id === place.id
                    ? "bg-[#F5F5F0] border-slate-300 shadow-sm"
                    : "bg-white border-slate-200/60 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: getPinColor(place.type) }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{place.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 inline-block">
                      {place.typeName}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2.5 space-y-1 text-[11px] text-slate-500 border-t border-dashed border-slate-100 pt-2">
                  <p className="flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{place.address}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{place.phone}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Interactive Map Frame */}
        <div className="lg:col-span-2 relative h-[400px] rounded-xl overflow-hidden border border-slate-200">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              center={center}
              zoom={zoom}
              mapId="FARMERS_SERVICES_LOCATOR"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              style={{ width: "100%", height: "100%" }}
            >
              {mockPlaces.map((place) => (
                <AdvancedMarker
                  key={place.id}
                  position={{ lat: place.lat, lng: place.lng }}
                  onClick={() => setSelectedPlace(place)}
                >
                  <Pin background={getPinColor(place.type)} glyphColor="#fff" />
                </AdvancedMarker>
              ))}

              {selectedPlace && (
                <InfoWindow
                  position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                  onCloseClick={() => setSelectedPlace(null)}
                >
                  <div className="p-1 max-w-[200px] text-xs">
                    <h4 className="font-bold text-slate-800">{selectedPlace.name}</h4>
                    <p className="text-[10px] text-olive font-semibold mt-0.5">{selectedPlace.typeName}</p>
                    <p className="text-slate-500 mt-1.5 leading-relaxed">{selectedPlace.address}</p>
                    <p className="text-slate-500 font-medium mt-1">📞 {selectedPlace.phone}</p>
                    <p className="text-[10px] text-slate-400 mt-1">🕒 {selectedPlace.hours}</p>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>

          <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 text-white backdrop-blur-sm p-2 rounded-lg text-[10px] border border-slate-700/50 shadow space-y-1 pointer-events-none">
            <p className="font-bold text-olive flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Legend
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-300">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-olive rounded-full" /> Govt Center</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Fertilizer</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Mandi</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Research Lab</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
