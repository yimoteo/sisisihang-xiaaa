import React from "react";
import * as Icons from "lucide-react";
import { DesignStyle } from "../types";

interface StyleCarouselProps {
  styles: DesignStyle[];
  selectedStyleId: string;
  onSelectStyle: (style: DesignStyle) => void;
}

// Dynamically render Lucide Icons by name string
function StyleIcon({ name }: { name: string }) {
  const IconComponent = (Icons as any)[name];
  if (IconComponent) {
    return <IconComponent className="w-5 h-5" />;
  }
  return <Icons.Sparkles className="w-5 h-5" />;
}

export default function StyleCarousel({
  styles,
  selectedStyleId,
  onSelectStyle,
}: StyleCarouselProps) {
  return (
    <div className="flex flex-col gap-3 w-full" id="style-carousel-root">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-300 font-display uppercase tracking-wider">
          Select Design Style
        </h4>
        <span className="text-xs text-slate-500 font-mono">
          {styles.length} styles available
        </span>
      </div>

      {/* Horizontal Carousel Container */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {styles.map((style) => {
          const isSelected = style.id === selectedStyleId;
          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style)}
              className={`flex-shrink-0 flex flex-col gap-2 items-start text-left p-4 rounded-xl border transition-all duration-300 w-48 ${
                isSelected
                  ? "bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30"
                  : "bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                }`}
              >
                <StyleIcon name={style.iconName} />
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-sm font-semibold font-display transition-colors ${
                    isSelected ? "text-indigo-400" : "text-slate-200"
                  }`}
                >
                  {style.name}
                </span>
                <span className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {style.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
