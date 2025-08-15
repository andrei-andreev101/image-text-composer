import React, { useState } from "react";
import type { TextLayer } from "@/types/editor";

interface LayersPanelProps {
  layers: TextLayer[];
  selectedIds: Set<string>;
  onSelectLayer: (id: string | null) => void;
  onToggleSelection: (id: string) => void;
  onReorderLayers: (fromIndex: number, toIndex: number) => void;
}

export function LayersPanel({ layers, selectedIds, onSelectLayer, onToggleSelection, onReorderLayers }: LayersPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderLayers(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="border border-neutral-200 rounded p-3 overflow-auto">
      <div className="font-medium mb-2 flex items-center justify-between">
        <span>Layers</span>
        {selectedIds.size > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {selectedIds.size} selected
          </span>
        )}
      </div>
      <div className="space-y-1">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-center gap-2 p-2 rounded cursor-pointer transition-colors
              ${selectedIds.has(layer.id) 
                ? "bg-blue-100 border border-blue-300" 
                : "bg-neutral-50 border border-transparent hover:bg-neutral-100"
              }
              ${draggedIndex === index ? "opacity-50" : ""}
              ${dragOverIndex === index && draggedIndex !== index ? "border-dashed border-blue-400 bg-blue-50" : ""}
            `}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                onToggleSelection(layer.id);
              } else {
                onSelectLayer(layer.id);
              }
            }}
          >
            <div className="w-4 h-4 flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-neutral-400">
                <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{layer.text || "Empty text"}</div>
              <div className="text-xs text-neutral-500 truncate">
                {layer.fontFamily} • {layer.fontSize}px
              </div>
            </div>
            <div className="text-xs text-neutral-400">
              {index + 1}
            </div>
          </div>
        ))}
        {layers.length === 0 && (
          <div className="text-neutral-500 text-sm p-2 text-center">
            No layers yet. Add text to get started.
          </div>
        )}
      </div>
    </div>
  );
}
