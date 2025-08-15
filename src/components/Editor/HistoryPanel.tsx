import React from "react";

interface HistoryPanelProps {
  timeline: { label: string }[];
  pointer: number;
  onJumpTo: (index: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function HistoryPanel({ 
  timeline, 
  pointer, 
  onJumpTo, 
  canUndo, 
  canRedo, 
  onUndo, 
  onRedo 
}: HistoryPanelProps) {
  return (
    <div className="border border-neutral-200 rounded p-3 overflow-auto">
      <div className="font-medium mb-2 flex items-center justify-between">
        <span>History</span>
        <div className="flex gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="px-2 py-1 text-xs rounded bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="px-2 py-1 text-xs rounded bg-neutral-100 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>
      </div>
      
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {timeline.map((entry, index) => (
          <div
            key={index}
            onClick={() => onJumpTo(index)}
            className={`
              flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm
              ${index === pointer 
                ? "bg-blue-100 border border-blue-300" 
                : "bg-neutral-50 border border-transparent hover:bg-neutral-100"
              }
            `}
          >
            <div className="w-4 h-4 flex-shrink-0">
              {index === pointer ? (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              ) : (
                <div className="w-2 h-2 bg-neutral-300 rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate">{entry.label}</div>
            </div>
            <div className="text-xs text-neutral-400">
              {index + 1}
            </div>
          </div>
        ))}
        
        {timeline.length === 0 && (
          <div className="text-neutral-500 text-sm p-2 text-center">
            No history yet. Start editing to see changes.
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-neutral-500 text-center">
        {timeline.length} / 20 steps
      </div>
    </div>
  );
}
