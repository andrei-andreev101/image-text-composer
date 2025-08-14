import React from "react";
import type { TextLayer, TextAlign } from "@/types/editor";

interface PropertiesPanelProps {
  selectedLayer: TextLayer | null;
  onUpdateLayer: (updates: Partial<TextLayer>) => void;
}

export function PropertiesPanel({ selectedLayer, onUpdateLayer }: PropertiesPanelProps) {
  if (!selectedLayer) {
    return (
      <div className="border border-neutral-200 rounded p-3 overflow-auto">
        <div className="font-medium mb-2">Properties</div>
        <div className="text-neutral-500">Select a text layer to edit its properties</div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 rounded p-3 overflow-auto">
      <div className="font-medium mb-2">Properties</div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Font</label>
          <select
            className="px-2 py-1 rounded border border-neutral-300 w-64"
            value={selectedLayer.fontFamily}
            onChange={(e) => onUpdateLayer({ fontFamily: e.target.value })}
          >
            <optgroup label="Sans-serif">
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Raleway">Raleway</option>
              <option value="Ubuntu">Ubuntu</option>
              <option value="Noto Sans">Noto Sans</option>
            </optgroup>
            <optgroup label="Serif">
              <option value="Playfair Display">Playfair Display</option>
              <option value="Merriweather">Merriweather</option>
              <option value="Lora">Lora</option>
              <option value="PT Sans">PT Sans</option>
            </optgroup>
            <optgroup label="Monospace">
              <option value="Source Code Pro">Source Code Pro</option>
              <option value="Fira Code">Fira Code</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
            </optgroup>
            <optgroup label="Handwriting">
              <option value="Dancing Script">Dancing Script</option>
              <option value="Pacifico">Pacifico</option>
              <option value="Indie Flower">Indie Flower</option>
            </optgroup>
            <optgroup label="Display">
              <option value="Oswald">Oswald</option>
            </optgroup>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Size</label>
          <input
            type="number"
            className="px-2 py-1 rounded border border-neutral-300 w-24"
            value={selectedLayer.fontSize}
            onChange={(e) => onUpdateLayer({ fontSize: Number(e.target.value || 0) })}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Weight</label>
          <select
            className="px-2 py-1 rounded border border-neutral-300 w-32"
            value={selectedLayer.fontStyle}
            onChange={(e) => onUpdateLayer({ fontStyle: e.target.value as TextLayer["fontStyle"] })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
            <option value="bold italic">Bold Italic</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Color</label>
          <input
            type="color"
            className="w-10 h-10 border border-neutral-300 rounded"
            value={selectedLayer.fill}
            onChange={(e) => onUpdateLayer({ fill: e.target.value })}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Opacity</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={selectedLayer.opacity}
            onChange={(e) => onUpdateLayer({ opacity: Number(e.target.value) })}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Align</label>
          <select
            className="px-2 py-1 rounded border border-neutral-300 w-32"
            value={selectedLayer.align}
            onChange={(e) => onUpdateLayer({ align: e.target.value as TextAlign })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    </div>
  );
}
