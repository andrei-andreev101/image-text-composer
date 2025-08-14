import React from "react";

interface ControlsProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addTextLayer: () => void;
  removeSelected: () => void;
  moveLayer: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  exportPNG: () => void;
  selectedId: string | null;
  backgroundElement: HTMLImageElement | null;
}

export function Controls({
  fileInputRef,
  onFileChange,
  addTextLayer,
  removeSelected,
  exportPNG,
  selectedId,
  backgroundElement
}: ControlsProps) {
  return (
    <div className="flex w-full gap-3 items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        className="hidden"
        onChange={onFileChange}
      />
      
      <button
        className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
        onClick={() => fileInputRef.current?.click()}
      >
        Upload PNG
      </button>
      
      <button
        className="px-3 py-2 rounded bg-neutral-800 text-white disabled:opacity-50"
        onClick={addTextLayer}
        disabled={!backgroundElement}
      >
        Add Text
      </button>
      
      <button
        className="px-3 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
        onClick={removeSelected}
        disabled={!selectedId}
      >
        Delete Selected
      </button>
      
      <div className="h-6 w-px bg-neutral-300" />
      
      <button
        className="px-3 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
        onClick={exportPNG}
        disabled={!backgroundElement}
      >
        Export PNG
      </button>
    </div>
  );
}
