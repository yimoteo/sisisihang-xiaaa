import React, { useState, useEffect } from "react";
import { Sparkles, Compass, HelpCircle, RefreshCw, Undo2, ArrowUpRight, Check } from "lucide-react";
import { DESIGN_STYLES, ROOM_PRESETS } from "./presets";
import { Message, ShoppableItem } from "./types";
import PresetSelector from "./components/PresetSelector";
import StyleCarousel from "./components/StyleCarousel";
import CompareSlider from "./components/CompareSlider";
import ChatInterface from "./components/ChatInterface";

const LOADING_STEPS = [
  "Calibrating room geometry and scanning layout...",
  "Analyzing architectural shell (walls, windows, doors)...",
  "Decluttering existing furniture and staging zones...",
  "Applying high-end designer material textures...",
  "Simulating professional studio-grade daylighting...",
  "Polishing final custom decor and accessories...",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"preset" | "upload">("preset");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("living-room");
  const [selectedStyleId, setSelectedStyleId] = useState<string>("scandinavian");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");

  // Visualizer States
  const [originalImage, setOriginalImage] = useState<string>("");
  const [reimaginedImage, setReimaginedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Chat States
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Initialize preset data on mount or preset change
  useEffect(() => {
    if (activeTab === "preset") {
      const preset = ROOM_PRESETS.find((p) => p.id === selectedPresetId);
      const style = DESIGN_STYLES.find((s) => s.id === selectedStyleId);
      if (preset && style) {
        setOriginalImage(preset.originalImage);
        const prebakedImage = preset.styleImages[style.id] || null;
        setReimaginedImage(prebakedImage);

        // Load starting message with pre-defined shoppable products
        const prebakedItems = preset.shoppableItems[style.id] || [];
        setChatMessages([
          {
            id: "preset-welcome",
            role: "assistant",
            text: `Welcome! I have reimagined this ${preset.name} as a gorgeous, professional-grade "${style.name}" space. 

You can drag the divider on the visualizer back and forth to see the makeover. Below are high-quality shoppable items featured in this concept. Let me know if you would like to adjust the colors, add plants, or change furniture!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: prebakedItems,
          },
        ]);
      }
    } else {
      // If we switched to Custom Upload tab and we don't have an uploaded image yet
      if (!customImage) {
        setOriginalImage("https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"); // fallback template image
        setReimaginedImage(null);
        setChatMessages([
          {
            id: "upload-welcome",
            role: "assistant",
            text: "Hello! Upload a photo of your current room above, select a style in the carousel, and click 'Transform Room' to see your bespoke design makeover!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setOriginalImage(customImage);
      }
    }
  }, [activeTab, selectedPresetId, selectedStyleId, customImage]);

  // Loading Step Cycler during makeover generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      let stepIndex = 0;
      setLoadingMessage(LOADING_STEPS[0]);
      interval = setInterval(() => {
        stepIndex = (stepIndex + 1) % LOADING_STEPS.length;
        setLoadingMessage(LOADING_STEPS[stepIndex]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handler: Choose another Preset Room
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
  };

  // Handler: Choose another Style in Carousel
  const handleSelectStyle = (style: any) => {
    setSelectedStyleId(style.id);
  };

  // Handler: Custom image upload
  const handleUploadCustomImage = (base64: string) => {
    setCustomImage(base64);
    setOriginalImage(base64);
    setReimaginedImage(null);
  };

  // Handler: Clear custom uploaded image
  const handleClearCustomImage = () => {
    setCustomImage(null);
    setReimaginedImage(null);
    setOriginalImage("https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80");
  };

  // Handler: Call backend for live Image Makeover
  const handleGenerateMakeover = async () => {
    if (activeTab === "upload" && !customImage) {
      alert("Please upload a photo first.");
      return;
    }

    setIsGenerating(true);
    const styleObj = DESIGN_STYLES.find((s) => s.id === selectedStyleId);

    try {
      const response = await fetch("/api/design/makeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: originalImage,
          style: styleObj?.name || "Scandinavian",
          customInstructions: customInstructions,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Generation endpoint failed.");
      }

      setReimaginedImage(data.image);

      // Add positive greeting message from Atelier AI
      setChatMessages((prev) => [
        ...prev,
        {
          id: `makeover-success-${Date.now()}`,
          role: "assistant",
          text: `Voila! I have completed your room transformation into the "${styleObj?.name}" style!

Use the visual slider in the visualizer above to compare. What do you think of this makeover? Let's chat here to refine the rug colors, swap the seating, or add specific elements.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `makeover-error-${Date.now()}`,
          role: "assistant",
          text: `I apologize, but I encountered an error during image generation: "${err.message}". Please ensure you have set your Gemini API key in the panel and that your uploaded photo is a valid image.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Send a Refinement Message in Chat
  const handleSendMessage = async (text: string) => {
    const newUserMessage: Message = {
      id: `user-msg-${Date.now()}`,
      role: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, newUserMessage]);
    setIsChatLoading(true);

    const styleObj = DESIGN_STYLES.find((s) => s.id === selectedStyleId);

    try {
      const response = await fetch("/api/design/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatMessages.slice(-8), // Send recent context to avoid token bloat
          currentImage: reimaginedImage,
          originalImage: originalImage,
          style: styleObj?.name || "Scandinavian",
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Chat service failed.");
      }

      // If Gemini edited and generated a new refined image, apply it to the visualizer!
      if (data.updatedImage) {
        setReimaginedImage(data.updatedImage);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `assistant-msg-${Date.now()}`,
          role: "assistant",
          text: data.reply,
          items: data.shoppableItems,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `chat-error-${Date.now()}`,
          role: "assistant",
          text: `I'm sorry, I couldn't process that refinement request. Check your Gemini API credentials. Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const currentStyle = DESIGN_STYLES.find((s) => s.id === selectedStyleId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="app-root">
      {/* Upper Navigation / Decorative Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-md shadow-indigo-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-widest font-display text-white uppercase">
                Atelier AI
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                Luxury Interior Design Consultant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              Gemini Powered Maker
            </span>
          </div>
        </div>
      </header>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Visualizer Controls + Slider (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          {/* Preset or Upload Select Tray */}
          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
                1. Choose Your Canvas
              </h3>
            </div>
            <PresetSelector
              presets={ROOM_PRESETS}
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              customImage={customImage}
              onUploadCustomImage={handleUploadCustomImage}
              onClearCustomImage={handleClearCustomImage}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              customInstructions={customInstructions}
              setCustomInstructions={setCustomInstructions}
            />
          </div>

          {/* Style Carousel Tray */}
          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
              2. Choose Style Preset
            </h3>
            <StyleCarousel
              styles={DESIGN_STYLES}
              selectedStyleId={selectedStyleId}
              onSelectStyle={handleSelectStyle}
            />

            {/* If user is in upload mode, show explicit trigger button */}
            {activeTab === "upload" && (
              <button
                onClick={handleGenerateMakeover}
                disabled={!customImage || isGenerating}
                className="w-full mt-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold font-display transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Transforming Space...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Transform Room Photo
                  </>
                )}
              </button>
            )}
          </div>

          {/* Compare Before/After Slider Area */}
          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-900 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
                3. Space Visualization
              </h3>
              <p className="text-xs text-slate-400 italic">
                Drag slider to compare Before & After
              </p>
            </div>
            <CompareSlider
              originalImage={originalImage}
              reimaginedImage={reimaginedImage}
              isLoading={isGenerating}
              loadingMessage={loadingMessage}
            />
          </div>
        </div>

        {/* Right Side: Interactive AI Chatbot Refinement (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full lg:sticky lg:top-24">
          <div className="flex flex-col gap-2">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider px-1">
              4. Refine with Atelier
            </h3>
            <p className="text-xs text-slate-400 px-1 leading-relaxed">
              Our consultant is fully context-aware of your visualizer. Ask for design details or prompt edits!
            </p>
          </div>
          <ChatInterface
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isChatLoading={isChatLoading}
            activeStyleName={currentStyle?.name || "Scandinavian"}
          />
        </div>
      </main>

      {/* Decorative footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display tracking-widest text-[10px] text-slate-400 uppercase">
            Atelier AI © 2026 • Crafted for Elite Spaces
          </span>
          <span className="font-mono text-[9px] text-slate-600">
            Powered by models/gemini-3.5-flash & gemini-3.1-flash-image-preview
          </span>
        </div>
      </footer>
    </div>
  );
}
