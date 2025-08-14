"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useImageObject } from "@/hooks/useImageObject";
import type { TextLayer } from "@/types/editor";
import { Controls } from "./Controls";
import { LayersPanel } from "./LayersPanel";
import { Canvas, type CanvasRef } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";

export default function Editor() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<CanvasRef | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const background = useImageObject(imageUrl);

  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedId) || null,
    [layers, selectedId]
  );

  const [stageScale, setStageScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });

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
    setLayers((prev) => [
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
      },
    ]);
    setSelectedId(id);
  }, [background.width, background.height]);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const moveLayer = useCallback((id: string, dir: "up" | "down" | "top" | "bottom") => {
    setLayers((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index === -1) return prev;
      const copy = [...prev];
      const [layer] = copy.splice(index, 1);
      if (dir === "up") copy.splice(Math.min(index + 1, copy.length), 0, layer);
      if (dir === "down") copy.splice(Math.max(index - 1, 0), 0, layer);
      if (dir === "top") copy.push(layer);
      if (dir === "bottom") copy.unshift(layer);
      return copy;
    });
  }, []);

  const reorderLayers = useCallback((fromIndex: number, toIndex: number) => {
    setLayers((prev) => {
      const copy = [...prev];
      const [movedLayer] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedLayer);
      return copy;
    });
  }, []);

  const exportPNG = useCallback(async () => {
    setSelectedId(null);
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.exportPNG();
      }
    });
  }, []);

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
      setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, text: value } : l)));
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
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

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
        selectedId={selectedId}
        backgroundElement={background.element}
      />

      <div className="grid grid-cols-[320px_1fr_280px] gap-4 h-full">
        <LayersPanel
          layers={layers}
          selectedId={selectedId}
          onSelectLayer={setSelectedId}
          onReorderLayers={reorderLayers}
        />

        <div className="border border-neutral-200 rounded relative overflow-hidden" ref={mainRef}>
          <Canvas
            ref={canvasRef}
            background={background}
            layers={layers}
            selectedId={selectedId}
            editingId={editingId}
            stageSize={stageSize}
            stageScale={stageScale}
            onSelectLayer={setSelectedId}
            onUpdateLayer={updateLayer}
            onTextDblClick={onTextDblClick}
          />
        </div>

        <PropertiesPanel
          selectedLayer={selectedLayer}
          onUpdateLayer={(updates) => selectedId && updateLayer(selectedId, updates)}
        />
      </div>
    </div>
  );
}
