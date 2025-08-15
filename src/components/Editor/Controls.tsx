import React from "react";

interface ControlsProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addTextLayer: () => void;
  removeSelected: () => void;
  moveLayer: (id: string, dir: "up" | "down" | "top" | "bottom") => void;
  exportPNG: () => void;
  clearAutosave: () => void;
  resetEditor: () => void;
  selectedId: string | null;
  backgroundElement: HTMLImageElement | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function Controls({
  fileInputRef,
  onFileChange,
  addTextLayer,
  removeSelected,
  exportPNG,
  clearAutosave,
  resetEditor,
  selectedId,
  backgroundElement,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: ControlsProps) {
  return (
    <div className="flex w-full gap-3 items-center justify-between">
      <div className="flex gap-3 items-center">
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
        onClick={onUndo}
        disabled={!canUndo}
        className="px-3 py-2 rounded bg-neutral-600 text-white disabled:opacity-50"
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>
      
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="px-3 py-2 rounded bg-neutral-600 text-white disabled:opacity-50"
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
      
      <div className="h-6 w-px bg-neutral-300" />
      
      <button
        className="px-3 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
        onClick={exportPNG}
        disabled={!backgroundElement}
      >
        Export PNG
      </button>
      
      <div className="h-6 w-px bg-neutral-300" />
      
      <button
        className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        onClick={clearAutosave}
        title="Clear autosaved design data"
      >
        Clear Autosave
      </button>
      
      <div className="h-6 w-px bg-neutral-300" />
      
      <button
        className="px-3 py-2 rounded bg-orange-600 text-white hover:bg-orange-700"
        onClick={resetEditor}
        title="Reset editor to blank state"
      >
        Reset Editor
      </button>
      </div>
      
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Autosave active</span>
      </div>
    </div>
  );
}
