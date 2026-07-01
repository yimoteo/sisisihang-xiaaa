import React, { useState, useRef } from "react";
import { Upload, Home, Image as ImageIcon, Trash2, AlertCircle } from "lucide-react";
import { RoomPreset } from "../types";

interface PresetSelectorProps {
  presets: RoomPreset[];
  selectedPresetId: string | null;
  onSelectPreset: (presetId: string) => void;
  customImage: string | null;
  onUploadCustomImage: (base64: string) => void;
  onClearCustomImage: () => void;
  activeTab: "preset" | "upload";
  setActiveTab: (tab: "preset" | "upload") => void;
  customInstructions: string;
  setCustomInstructions: (text: string) => void;
}

export default function PresetSelector({
  presets,
  selectedPresetId,
  onSelectPreset,
  customImage,
  onUploadCustomImage,
  onClearCustomImage,
  activeTab,
  setActiveTab,
  customInstructions,
  setCustomInstructions,
}: PresetSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onUploadCustomImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full" id="preset-selector-root">
      {/* Tab Selectors */}
      <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab("preset")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold font-display transition-all ${
            activeTab === "preset"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Home className="w-4 h-4" />
          Curated Presets
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold font-display transition-all ${
            activeTab === "upload"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Custom Room
        </button>
      </div>

      {/* Curated Presets Grid */}
      {activeTab === "preset" && (
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset.id)}
                className={`flex flex-col text-left rounded-xl overflow-hidden border transition-all duration-300 group ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-600/5 ring-1 ring-indigo-500/30"
                    : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                  <img
                    src={preset.originalImage}
                    alt={preset.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                      <div className="bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-display">
                        Active Space
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-3">
                  <h5 className="text-sm font-semibold text-slate-200 font-display group-hover:text-white">
                    {preset.name}
                  </h5>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Custom Upload Area */}
      {activeTab === "upload" && (
        <div className="flex flex-col gap-3">
          {!customImage ? (
            /* Drag & Drop Card */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center ${
                isDragging
                  ? "border-indigo-500 bg-indigo-600/5 scale-[0.99]"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-4 rounded-full bg-slate-800 text-slate-400 mb-4 transition-colors group-hover:text-indigo-400">
                <Upload className="w-6 h-6 text-slate-400" />
              </div>
              <h5 className="text-sm font-semibold text-slate-200 font-display mb-1">
                Drag and drop your room photo
              </h5>
              <p className="text-xs text-slate-400 max-w-xs mb-3 leading-relaxed">
                Supports JPG, PNG, WebP up to 15MB. Ensure good lighting and a wide angle.
              </p>
              <button
                type="button"
                className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-display"
              >
                Select File
              </button>
            </div>
          ) : (
            /* Uploaded Preview State */
            <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                  {customImage ? (
                    <img
                      src={customImage}
                      alt="Custom upload"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 font-display">
                    Your Room Uploaded
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Ready to style
                  </span>
                </div>
              </div>
              <button
                onClick={onClearCustomImage}
                className="p-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-lg transition-colors"
                title="Remove image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Optional instructions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 font-display uppercase tracking-wider">
              Makeover Directives (Optional)
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. 'Add a blue velvet rug', 'use light oakwood', 'keep walls white'"
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}
