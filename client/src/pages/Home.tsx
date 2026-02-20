import { useState, useRef, useEffect } from "react";
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

  const toggleGeoSense = () => {
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
    
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setSelectedImage(null);

    const aiContent = selectedImage 
      ? [
          { type: "text", text: `${geoContext}${userMsg.content || "What is in this image?"}` },
          { type: "image_url", image_url: { url: selectedImage } }
        ]
      : `${geoContext}${userMsg.content}`;

    try {
      const response = await sendMessage.mutateAsync({
        message: aiContent,
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
      </header>

      <main className="flex-1 flex flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[800px]">
        <aside className="w-64 hidden lg:flex flex-col gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-[#E8F0ED] shadow-sm">
            <h3 className="text-[#1A3D35] font-bold mb-4 flex items-center gap-2">
              <Activity size={16} /> Necessities
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Safety Level</p>
                <p className="text-[#4AB295] font-bold">99.9% Secure</p>
              </div>
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">AI Status</p>
                <p className="text-[#4AB295] font-bold">
                  {sendMessage.isPending ? "Analyzing..." : "Ready"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-[#E8F0ED] shadow-sm">
            <h3 className="text-[#1A3D35] font-bold mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[#4AB295]" /> AI Capabilities
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Identification</p>
                <p className="text-[#4AB295] font-bold text-sm">Instant Pest ID</p>
              </div>
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">GeoSense</p>
                <p className={`text-sm font-bold ${location ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {location ? "Localization Active" : "Global Mode"}
                </p>
              </div>
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Responses</p>
                <p className="text-[#4AB295] font-bold text-sm">Eco-Safe Advice</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#E8F0ED] flex flex-col relative overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} {...msg} />
              ))}
              {sendMessage.isPending && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                  <div className="flex gap-1.5 p-4 bg-[#F3F8F6] rounded-2xl rounded-bl-none">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-2 h-2 bg-[#4AB29
