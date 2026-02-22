import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Activity, Zap, Plus, X, Compass, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Pest Control Assistant. What's bugging you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  const toggleGeoSense = () => {
    if (location) { setLocation(null); return; }
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setIsGeoLoading(false); },
      () => { setIsGeoLoading(false); alert("Location access denied."); }
    );
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || sendMessage.isPending) return;

    const geoContext = location ? `[User Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}] ` : "";
    const userMsg = { id: Date.now().toString(), role: "user", content: inputValue, image: selectedImage };
    const updatedHistory = [...messages, userMsg];
    
    setMessages(updatedHistory);
    setInputValue("");
    setSelectedImage(null);

    try {
      const response = await sendMessage.mutateAsync({
        message: selectedImage ? [{ type: "text", text: `${geoContext}${userMsg.content || "Identify this"}` }, { type: "image_url", image_url: { url: selectedImage } }] : `${geoContext}${userMsg.content}`,
        history: updatedHistory.map(m => ({ role: m.role, content: m.content })),
        liveOnly: true,
        model: "google/gemini-flash-1.5",
      });
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: response.response }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: "err", role: "error", content: "Connection error." }]);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#1f1f1f] overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.aside 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 p-6 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-[#1A3D35]">Dashboard</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><X /></Button>
              </div>
              
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Activity size={14}/> Necessities</h3>
                  <div className="bg-[#f0f4f9] p-4 rounded-2xl space-y-3">
                    <div><p className="text-[10px] font-bold text-gray-500 uppercase">Safety Level</p><p className="text-[#4AB295] font-bold">99.9% Secure</p></div>
                    <div><p className="text-[10px] font-bold text-gray-500 uppercase">AI Status</p><p className="text-[#4AB295] font-bold">{sendMessage.isPending ? "Analyzing..." : "Ready"}</p></div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Zap size={14} className="text-[#4AB295]"/> AI Capabilities</h3>
                  <div className="bg-[#f0f4f9] p-4 rounded-2xl space-y-3 text-sm font-medium">
                    <p className="text-[#4AB295]">✓ Instant Pest ID</p>
                    <p className={location ? "text-[#4AB295]" : "text-gray-400"}>✓ GeoSense Localization</p>
                    <p className="text-[#4AB295]">✓ Eco-Safe Advice</p>
                  </div>
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="p-4 flex justify-between items-center w-full sticky top-0 bg-white/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-[#4AB295] rounded-lg flex items-center justify-center shadow-sm">
            <Sparkles className="text-white" size={16} />
          </div>
          <h1 className="text-lg font-medium">PestControlAI</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="rounded-full">
          <Menu size={24} />
        </Button>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-8 pb-40 space-y-10">
          <AnimatePresence mode="popLayout">
            {messages.length === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-20">
                <h2 className="text-4xl md:text-5xl font-medium bg-gradient-to-r from-[#4AB295] to-[#1A3D35] bg-clip-text text-transparent mb-4">
                  What's bugging you today?
                </h2>
                <p className="text-[#444746] text-lg">Upload a photo or describe the pest to get started.</p>
              </motion.div>
            )}
            {messages.map((msg) => <ChatMessage key={msg.id} {...msg} />)}
          </AnimatePresence>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white pb-6 px-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="bg-[#f0f4f9] rounded-[32px] p-2 pr-4 flex flex-col">
              {selectedImage && (
                <div className="p-2 relative inline-block self-start">
                  <img src={selectedImage} className="w-20 h-20 object-cover rounded-xl border-2 border-white" />
                  <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md"><X size={12}/></button>
                </div>
              )}
              <div className="flex items-center">
                <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { const r = new FileReader(); r.onloadend = () => setSelectedImage(r.result as string); r.readAsDataURL(file); }
                }} />
                <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="rounded-full h-12 w-12 text-[#444746]"><Plus size={24} /></Button>
                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter a prompt here..." className="bg-transparent border-none shadow-none text-lg py-6 focus-visible:ring-0" />
                <div className="flex items-center gap-1">
                  <button type="button" onClick={toggleGeoSense} className={`p-3 rounded-full ${location ? 'text-[#4AB295]' : 'text-[#444746]'}`}><Compass size={24} /></button>
                  {(inputValue.trim() || selectedImage) && (
                    <Button type="submit" disabled={sendMessage.isPending} className="h-12 w-12 rounded-full bg-[#4AB295] p-0"><Send size={20} className="text-white" /></Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
