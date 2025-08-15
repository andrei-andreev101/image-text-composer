"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useImageObject } from "@/hooks/useImageObject";
import { useHistory } from "@/hooks/useHistory";
import { useAutosave } from "@/hooks/useAutosave";
import type { TextLayer } from "@/types/editor";
import { Controls } from "./Controls";
import { LayersPanel } from "./LayersPanel";
import { Canvas, type CanvasRef } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { HistoryPanel } from "./HistoryPanel";
import { Toast } from "../Toast";
import { ConfirmDialog } from "../ConfirmDialog";

export default function Editor() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<CanvasRef | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const background = useImageObject(imageUrl);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  // Helper functions for selection management
  const selectLayer = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set([id]));
    }
  }, []);

  const toggleLayerSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const addToSelection = useCallback((id: string) => {
    setSelectedIds(prev => new Set([...prev, id]));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const getSelectedId = useCallback(() => {
    return Array.from(selectedIds)[0] || null;
  }, [selectedIds]);
  
  const {
    value: layers,
    set: setLayersWithHistory,
    undo,
    redo,
    jumpTo,
    canUndo,
    canRedo,
    timeline,
    pointer,
  } = useHistory<TextLayer[]>([], 20);

  const selectedLayer = useMemo(
    () => {
      const selectedId = Array.from(selectedIds)[0];
      return layers.find((l) => l.id === selectedId) || null;
    },
    [layers, selectedIds]
  );

  const [stageScale, setStageScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Design autosaved to browser storage");
  const [toastType, setToastType] = useState<'success' | 'info' | 'warning' | 'error'>('success');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Autosave functionality
  const { loadFromStorage, clearAutosave } = useAutosave(
    layers,
    imageUrl,
    stageSize,
    stageScale,
    () => {
      setToastMessage("Design autosaved to browser storage");
      setToastType('success');
      setShowToast(true);
    } // Show toast when autosave happens
  );

  // Restore from autosave on component mount
  useEffect(() => {
    const savedData = loadFromStorage();
    if (savedData) {
      // Restore layers
      setLayersWithHistory(savedData.layers, "Restore from autosave");
      
      // Note: We don't restore the image URL as it might be a blob URL that's no longer valid
      // The user will need to re-upload their image, but all text layers will be preserved
      
      // Restore stage settings
      setStageSize(savedData.stageSize);
      setStageScale(savedData.stageScale);
      
      // Show a notification if there was a saved image
      if (savedData.hasImage) {
        console.log('Autosave: Design restored. Please re-upload your background image to see the complete design.');
      }
    }
  }, []); // Only run on mount

  useEffect(() => {
    function fit() {
      if (!background.element || !mainRef.current) return;
      
      const maxW = mainRef.current.clientWidth;
      const maxH = mainRef.current.clientHeight;
      const imgW = background.width || 1;
      const imgH = background.height || 1;
      
      const scale = Math.min(maxW / imgW, maxH / imgH);
      setStageScale(scale);
      setStageSize({ width: imgW, height: imgH });
    }
    
    if (background.element && background.width > 0 && background.height > 0) {
      fit();
    }
  }, [background.element, background.width, background.height]);

  const handleUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/png") {
      handleUpload(file);
    }
  }, [handleUpload]);

  const addTextLayer = useCallback(() => {
    const id = nanoid();
    setLayersWithHistory((prev) => [
      ...prev,
      {
        id,
        text: "Double-click to edit",
        x: (background.width || 800) * 0.1,
        y: (background.height || 600) * 0.1,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: Math.max(200, (background.width || 800) * 0.5),
        draggable: true,
        fontFamily: "Roboto",
        fontSize: 48,
        fontStyle: "bold",
        fill: "#000000",
        opacity: 1,
        align: "left",
        shadowColor: "#000000",
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      },
    ], "Add text layer");
    selectLayer(id);
  }, [background.width, background.height, setLayersWithHistory, selectLayer]);

  const removeSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setLayersWithHistory((prev) => prev.filter((l) => !selectedIds.has(l.id)), "Delete layers");
    clearSelection();
  }, [selectedIds, setLayersWithHistory, clearSelection]);

  const moveLayer = useCallback((id: string, dir: "up" | "down" | "top" | "bottom") => {
    setLayersWithHistory((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index === -1) return prev;
      const copy = [...prev];
      const [layer] = copy.splice(index, 1);
      if (dir === "up") copy.splice(Math.min(index + 1, copy.length), 0, layer);
      if (dir === "down") copy.splice(Math.max(index - 1, 0), 0, layer);
      if (dir === "top") copy.push(layer);
      if (dir === "bottom") copy.unshift(layer);
      return copy;
    }, `Move layer ${dir}`);
  }, [setLayersWithHistory]);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayersWithHistory((prev) => {
      const copy = [...prev];
      const [movedLayer] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedLayer);
      return copy;
    }, "Reorder layers");
  }, [setLayersWithHistory]);

  const exportPNG = useCallback(async () => {
    clearSelection();
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.exportPNG();
      }
    });
  }, [clearSelection]);

  const onTextDblClick = useCallback((id: string) => {
    const layerData = layers.find((l) => l.id === id);
    if (!layerData) return;

    setEditingId(id);

    const area = document.createElement("textarea");
    area.value = layerData.text;
    area.style.position = "fixed";
    area.style.top = "50%";
    area.style.left = "50%";
    area.style.transform = "translate(-50%, -50%)";
    area.style.width = "300px";
    area.style.height = "100px";
    area.style.fontSize = "16px";
    area.style.fontFamily = layerData.fontFamily;
    area.style.color = layerData.fill;
    area.style.background = "white";
    area.style.border = "2px solid #333";
    area.style.borderRadius = "8px";
    area.style.padding = "12px";
    area.style.zIndex = "1000";
    area.style.resize = "none";

    document.body.appendChild(area);
    area.focus();

    function commit() {
      const value = area.value;
      setLayersWithHistory((prev) => prev.map((l) => (l.id === id ? { ...l, text: value } : l)), "Edit text");
      setEditingId(null);
      document.body.removeChild(area);
    }

    area.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        commit();
      } else if (e.key === "Escape") {
        setEditingId(null);
        document.body.removeChild(area);
      }
    });
    area.addEventListener("blur", commit);
  }, [layers]);

  const updateLayer = useCallback((id: string, updates: Partial<TextLayer>) => {
    setLayersWithHistory((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)), "Update layer");
  }, [setLayersWithHistory]);

  // Update multiple layers at once (for group transforms)
  const updateMultipleLayers = useCallback((updates: Partial<TextLayer>) => {
    setLayersWithHistory((prev) => 
      prev.map((l) => selectedIds.has(l.id) ? { ...l, ...updates } : l), 
      "Update multiple layers"
    );
  }, [selectedIds, setLayersWithHistory]);

  // Reset editor to blank state
  const resetEditor = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  // Actually perform the reset
  const performReset = useCallback(() => {
    // Clear all layers
    setLayersWithHistory([], "Reset editor");
    
    // Clear selected and editing states
    clearSelection();
    setEditingId(null);
    
    // Clear background image
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    
    // Reset stage to default size
    setStageSize({ width: 900, height: 600 });
    setStageScale(1);
    
    // Clear autosave data
    clearAutosave();
    
    // Close confirmation dialog
    setShowResetConfirm(false);
    
    // Show reset confirmation toast
    setToastMessage("Editor reset to blank state");
    setToastType('info');
    setShowToast(true);
  }, [setLayersWithHistory, clearAutosave, clearSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'a':
            e.preventDefault();
            // Select all layers
            setSelectedIds(new Set(layers.map(l => l.id)));
            break;
        }
      } else if (e.key === 'Escape') {
        // Clear selection
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, layers, clearSelection]);

  return (
    <div className="w-full h-[100dvh] grid grid-rows-[auto_auto_1fr] gap-3 p-4 select-none">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">PNG Text Editor</div>
      </div>

      <Controls
        fileInputRef={fileInputRef}
        onFileChange={onFileChange}
        addTextLayer={addTextLayer}
        removeSelected={removeSelected}
        moveLayer={moveLayer}
        exportPNG={exportPNG}
        clearAutosave={clearAutosave}
        resetEditor={resetEditor}
        selectedId={getSelectedId()}
        backgroundElement={background.element}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="flex gap-4 h-full">
        <div className="flex flex-col gap-4 w-xs">
          <LayersPanel
            layers={layers}
            selectedIds={selectedIds}
            onSelectLayer={selectLayer}
            onToggleSelection={toggleLayerSelection}
            onReorderLayers={reorderLayers}
          />
          
          <HistoryPanel
            timeline={timeline}
            pointer={pointer}
            onJumpTo={jumpTo}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        </div>

        <div className="border flex-1 border-neutral-200 rounded relative overflow-hidden" ref={mainRef}>
          <Canvas
            ref={canvasRef}
            background={background}
            layers={layers}
            selectedIds={selectedIds}
            editingId={editingId}
            stageSize={stageSize}
            stageScale={stageScale}
            onSelectLayer={selectLayer}
            onToggleSelection={toggleLayerSelection}
            onUpdateLayer={updateLayer}
            onTextDblClick={onTextDblClick}
          />
        </div>

        <PropertiesPanel
          selectedLayer={selectedLayer}
          onUpdateLayer={(updates) => {
            const selectedId = getSelectedId();
            if (selectedId) updateLayer(selectedId, updates);
          }}
        />
      </div>
      
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset Editor"
        message="This will clear all layers, remove the background image, and reset the editor to a blank state. This action cannot be undone."
        confirmText="Reset Editor"
        cancelText="Cancel"
        onConfirm={performReset}
        onCancel={() => setShowResetConfirm(false)}
        type="danger"
      />
    </div>
  );
}
