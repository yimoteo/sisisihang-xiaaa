import React, { useState, useRef, useEffect } from "react";
import { ArrowLeftRight, Sparkles } from "lucide-react";

interface CompareSliderProps {
  originalImage: string;
  reimaginedImage: string | null;
  isLoading: boolean;
  loadingMessage: string;
}

export default function CompareSlider({
  originalImage,
  reimaginedImage,
  isLoading,
  loadingMessage,
}: CompareSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle manual dragging directly on the visualizer container
  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex flex-col gap-4 w-full" id="compare-slider-root">
      {/* Visualizer Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-4/3 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 select-none cursor-ew-resize group"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* Original (Before) - Base Layer */}
        {originalImage ? (
          <img
            src={originalImage}
            alt="Original Space"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10 text-xs font-medium text-slate-300 pointer-events-none uppercase tracking-wider font-display">
          Before
        </div>

        {/* Reimagined (After) - Overlay Layer with Dynamic Clip Path */}
        {reimaginedImage && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
            }}
          >
            <img
              src={reimaginedImage}
              alt="Reimagined Space"
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {reimaginedImage && (
          <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-indigo-600/90 backdrop-blur-md rounded-full border border-indigo-400/30 text-xs font-semibold text-white pointer-events-none uppercase tracking-wider font-display flex items-center gap-1 shadow-md">
            <Sparkles className="w-3.5 h-3.5" /> Reimagined
          </div>
        )}

        {/* Drag Line Handle */}
        {reimaginedImage && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-white/90 cursor-ew-resize z-20 shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-shadow group-hover:bg-white"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white text-slate-800 shadow-2xl border border-slate-200 flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="relative flex items-center justify-center w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-white font-display mb-2">Transforming Your Room</h3>
            <p className="text-sm text-slate-400 max-w-sm animate-pulse">{loadingMessage}</p>
          </div>
        )}

        {/* No Reimagined Image Placeholder Advice */}
        {!reimaginedImage && !isLoading && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-base font-semibold text-white font-display mb-1">Makeover Ready</h3>
            <p className="text-xs text-slate-300 max-w-xs">
              Select a design style from the carousel below to start your transformation.
            </p>
          </div>
        )}
      </div>

      {/* Manual Sleek Bottom Range Slider for Accessibility */}
      {reimaginedImage && !isLoading && (
        <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-slate-400">
          <span className="text-xs font-semibold uppercase tracking-wider font-display text-slate-400">Original</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="flex-1 accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none outline-none"
          />
          <span className="text-xs font-semibold uppercase tracking-wider font-display text-indigo-400">AI Reimagined</span>
        </div>
      )}
    </div>
  );
}
