import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Activity, ShieldCheck, Zap, Plus, X, Image as ImageIcon, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Pest Control Assistant. How can I help you today?",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  // New state for role and map
  const [role, setRole] = useState<"regular" | "business">("regular");
  const [map, setMap] = useState<L.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const toggleGeoSense = () => {
    if (location) {
      setLocation(null);
      return;
    }
    if (!navigator.geolocation) return alert("Geolocation not supported by your browser.");
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsGeoLoading(false);
      },
      () => {
        setIsGeoLoading(false);
        alert("Location access denied.");
      }
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, sendMessage.isPending]);

  // Initialize Leaflet map for business role
  useEffect(() => {
    if (role === "business" && mapRef.current && !map) {
      const newMap = L.map(mapRef.current).setView([-1.286389, 36.817223], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(newMap);
      setMap(newMap);
    }
  }, [role, map]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || sendMessage.isPending) return;

    const geoContext = location ? `[User Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}] ` : "";
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      image: selectedImage
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue("");
    setSelectedImage(null);

    let aiContent;
    if (selectedImage) {
      aiContent = [
        { type: "text", text: `${geoContext}${userMsg.content || "What is in this image?"}` },
        { type: "image_url", image_url: { url: selectedImage } }
      ];
    } else {
      aiContent = `${geoContext}${userMsg.content}`;
    }

    try {
      const response = await sendMessage.mutateAsync({
        message: aiContent,
        history: updatedHistory.map(m => ({ role: m.role, content: m.content })),
        liveOnly: true,
        model: "google/gemini-flash-1.5",
      });

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: response.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: "err", role: "error", content: "Connection error." },
      ]);
    }
  };

  // Function to fetch and draw route
  async function showRoute(origin, destination) {
    const res = await fetch(`/api/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`);
    const data = await res.json();

    if (map && data.geometry) {
      L.geoJSON(data.geometry).addTo(map);
      alert(`ETA: ${data.durationMinutes} minutes, Distance: ${data.distanceKm} km`);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FBF9] flex flex-col font-sans">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4AB295] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35]">
              PestControl<span className="text-[#4AB295]">AI</span>
            </h1>
            <p className="text-xs text-gray-500">Smart Identification & Advice</p>
          </div>
        </div>
        {/* Simple role toggle for demo */}
        <Button onClick={() => setRole(role === "regular" ? "business" : "regular")}>
          Switch to {role === "regular" ? "Business" : "Regular"} Mode
        </Button>
      </header>

      <main className="flex-1 flex flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[800px]">
        {role === "business" ? (
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow border p-6">
            <h2 className="text-lg font-bold mb-4">Business Dashboard</h2>
            <div ref={mapRef} style={{ height: "400px", width: "100%" }} />
            <Button
              className="mt-4 bg-[#4AB295] text-white"
              onClick={() => showRoute(
                { lat: -1.286389, lng: 36.817223 }, // HQ
                { lat: -1.2921, lng: 36.8219 }      // Example client
              )}
            >
              Show Route to Client
            </Button>
          </div>
        ) : (
          // Existing chat UI
          <div className="flex-1 bg-white rounded-[2.5rem] shadow border flex flex-col relative overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} {...msg} />
                ))}
                {sendMessage.isPending && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                    <div className="flex gap-1.5 p-4 bg-[#F3F8F6] rounded-2xl rounded-bl-none">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="w-2 h-2 bg-[#4AB295] rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#4AB295] uppercase tracking-tighter">
                      {location ? "Loading GeoSense" : "AI Analyzing"}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="px-10 pb-10 pt-2 relative">
              <form onSubmit={handleSend} className="relative flex flex-col">
                <div className="relative flex items-center">
                  <input type="file" className="hidden" ref={fileInputRef}
