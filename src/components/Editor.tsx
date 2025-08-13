"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from "react-konva";
import Konva from "konva";
import { nanoid } from "nanoid";

type EditorImage = {
  element: HTMLImageElement | null;
  width: number;
  height: number;
};

type TextAlign = "left" | "center" | "right";

type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  width: number;
  draggable: boolean;
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  fill: string;
  opacity: number;
  align: TextAlign;
};

function useImageObject(url: string | null) {
  const [image, setImage] = useState<EditorImage>({ element: null, width: 0, height: 0 });

  useEffect(() => {
    if (!url) {
      setImage({ element: null, width: 0, height: 0 });
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage({ element: img, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
    return () => {
      setImage({ element: null, width: 0, height: 0 });
    };
  }, [url]);

  return image;
}

export default function Editor() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const background = useImageObject(imageUrl);

  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedId) || null,
    [layers, selectedId]
  );

  const [stageScale, setStageScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function fit() {
      const container = containerRef.current;
      if (!container) return;
      const maxW = container.clientWidth;
      const maxH = container.clientHeight;
      const imgW = background.width || 1;
      const imgH = background.height || 1;
      const scale = Math.min(maxW / imgW, maxH / imgH);
      setStageScale(scale);
      setStageSize({ width: imgW, height: imgH });
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [background.width, background.height]);

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
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 48,
        fontStyle: "bold",
        fill: "#ffffff",
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

  const exportPNG = useCallback(async () => {
    setSelectedId(null);
    setTimeout(() => {
      if (!stageRef.current || !background.element) return;
      const uri = stageRef.current.toDataURL({ pixelRatio: 1 });
      const link = document.createElement("a");
      link.download = "design.png";
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }, [stageRef, background.element]);

  const onTextDblClick = useCallback((id: string) => {
    const stage = stageRef.current;
    if (!stage) return;
    const layerData = layers.find((l) => l.id === id);
    if (!layerData) return;

    type ClientRect = { x: number; y: number; width: number; height: number };
    const node = stage.findOne(`#${id}`) as Konva.Node | null;
    if (!node) return;
    const textPosition = node.getClientRect({ relativeTo: stage }) as ClientRect;
    const containerBox = stage.container().getBoundingClientRect();

    const area = document.createElement("textarea");
    area.value = layerData.text;
    area.style.position = "absolute";
    area.style.top = `${containerBox.top + textPosition.y * stageScale}px`;
    area.style.left = `${containerBox.left + textPosition.x * stageScale}px`;
    area.style.width = `${layerData.width * stageScale}px`;
    area.style.transformOrigin = "top left";
    area.style.transform = `rotate(${layerData.rotation}deg)`;
    area.style.fontSize = `${layerData.fontSize * stageScale}px`;
    area.style.fontFamily = layerData.fontFamily;
    area.style.color = layerData.fill;
    area.style.lineHeight = "1.2";
    area.style.background = "transparent";
    area.style.border = "1px dashed #888";
    area.style.outline = "none";
    area.style.resize = "none";
    area.style.padding = "4px";
    area.style.whiteSpace = "pre-wrap";
    area.style.overflow = "hidden";
    area.style.zIndex = "1000";

    document.body.appendChild(area);
    area.focus();

    function commit() {
      const value = area.value;
      setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, text: value } : l)));
      document.body.removeChild(area);
    }

    area.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        commit();
      } else if (e.key === "Escape") {
        document.body.removeChild(area);
      }
    });
    area.addEventListener("blur", commit);
  }, [layers, stageScale]);

  useEffect(() => {
    if (!trRef.current) return;
    const transformer = trRef.current;
    const node = stageRef.current?.findOne(`#${selectedId || ""}`) as Konva.Node | undefined;
    if (node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedId, layers]);

  const Controls = useMemo(() => (
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
        disabled={!background.element}
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
        onClick={() => selectedId && moveLayer(selectedId, "up")}
        disabled={!selectedId}
      >
        Bring Forward
      </button>
      <button
        className="px-3 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
        onClick={() => selectedId && moveLayer(selectedId, "down")}
        disabled={!selectedId}
      >
        Send Backward
      </button>
      <button
        className="px-3 py-2 rounded bg-neutral-700 text-white disabled:opacity-50"
        onClick={exportPNG}
        disabled={!background.element}
      >
        Export PNG
      </button>
      <div className="ml-auto flex items-center gap-2">
        <label className="text-sm text-neutral-600">Zoom</label>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={stageScale}
          onChange={(e) => setStageScale(parseFloat(e.target.value))}
        />
      </div>
    </div>
  ), [addTextLayer, background.element, moveLayer, onFileChange, removeSelected, selectedId, stageScale, exportPNG]);

  const SelectedStyleControls = useMemo(() => {
    if (!selectedLayer) return null;
    return (
      <div className="grid  gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Font</label>
          <input
            className="px-2 py-1 rounded border border-neutral-300 w-64"
            value={selectedLayer.fontFamily}
            onChange={(e) =>
              setLayers((prev) => prev.map((l) => (l.id === selectedLayer.id ? { ...l, fontFamily: e.target.value } : l)))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Size</label>
          <input
            type="number"
            className="px-2 py-1 rounded border border-neutral-300 w-24"
            value={selectedLayer.fontSize}
            onChange={(e) =>
              setLayers((prev) => prev.map((l) => (l.id === selectedLayer.id ? { ...l, fontSize: Number(e.target.value || 0) } : l)))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Weight</label>
          <select
            className="px-2 py-1 rounded border border-neutral-300 w-32"
            value={selectedLayer.fontStyle}
            onChange={(e) =>
              setLayers((prev) =>
                prev.map((l) =>
                  l.id === selectedLayer.id
                    ? { ...l, fontStyle: e.target.value as TextLayer["fontStyle"] }
                    : l
                )
              )
            }
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
            onChange={(e) =>
              setLayers((prev) => prev.map((l) => (l.id === selectedLayer.id ? { ...l, fill: e.target.value } : l)))
            }
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
            onChange={(e) =>
              setLayers((prev) => prev.map((l) => (l.id === selectedLayer.id ? { ...l, opacity: Number(e.target.value) } : l)))
            }
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Align</label>
          <select
            className="px-2 py-1 rounded border border-neutral-300 w-32"
            value={selectedLayer.align}
            onChange={(e) =>
              setLayers((prev) => prev.map((l) => (l.id === selectedLayer.id ? { ...l, align: e.target.value as TextAlign } : l)))
            }
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    );
  }, [selectedLayer]);

  return (
    <div className="w-full h-[100dvh] grid grid-rows-[auto_auto_1fr] gap-3 p-4 select-none">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">PNG Text Editor</div>
        <div className="text-xs text-neutral-500">Desktop-only</div>
      </div>

      {Controls}

      <div className="grid grid-cols-[320px_1fr_280px] gap-4 h-full">
        <div className="border border-neutral-200 rounded p-3 overflow-auto">
          <div className="font-medium mb-2">Layers</div>
          <div className="flex flex-col gap-2">
            {[...layers]
              .reverse()
              .map((l) => (
                <button
                  key={l.id}
                  className={`text-left px-3 py-2 rounded border ${
                    selectedId === l.id ? "border-black bg-neutral-100" : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                  onClick={() => setSelectedId(l.id)}
                >
                  {`Text ${layers.findIndex((x) => x.id === l.id) + 1}`} – {l.text.slice(0, 24) || "(empty)"}
                </button>
              ))}
          </div>
        </div>
        <div className="border border-neutral-200 rounded relative overflow-hidden">
          <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-[#f5f5f5]">
            {background.element ? (
              <Stage
                ref={stageRef}
                width={stageSize.width}
                height={stageSize.height}
                scaleX={stageScale}
                scaleY={stageScale}
                onMouseDown={(e) => {
                  const clickedOnEmpty = e.target === e.target.getStage();
                  if (clickedOnEmpty) setSelectedId(null);
                }}
              >
                <Layer listening={true}>
                  <KonvaImage image={background.element} width={background.width} height={background.height} />
                  {layers.map((t) => (
                    <KonvaText
                      key={t.id}
                      id={t.id}
                      text={t.text}
                      x={t.x}
                      y={t.y}
                      width={t.width}
                      draggable={t.draggable}
                      fill={t.fill}
                      fontSize={t.fontSize}
                      fontFamily={t.fontFamily}
                      fontStyle={t.fontStyle}
                      opacity={t.opacity}
                      align={t.align}
                      rotation={t.rotation}
                      scaleX={t.scaleX}
                      scaleY={t.scaleY}
                      onClick={() => setSelectedId(t.id)}
                      onTap={() => setSelectedId(t.id)}
                      onDblClick={() => onTextDblClick(t.id)}
                      onDragEnd={(e) => {
                        const { x, y } = e.target.position();
                        setLayers((prev) => prev.map((l) => (l.id === t.id ? { ...l, x, y } : l)));
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target as Konva.Text;
                        const scaleX = node.scaleX();
                        const rotation = node.rotation();
                        const width = Math.max(20, node.width() * scaleX);
                        node.scaleX(1);
                        node.scaleY(1);
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === t.id ? { ...l, scaleX: 1, scaleY: 1, rotation, width } : l
                          )
                        );
                      }}
                    />
                  ))}
                  <Transformer
                    ref={trRef}
                    rotateEnabled={true}
                    enabledAnchors={["middle-left", "middle-right"]}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 20) return oldBox;
                      return newBox;
                    }}
                  />
                </Layer>
              </Stage>
            ) : (
              <div className="text-neutral-500">Upload a PNG to start editing</div>
            )}
          </div>
        </div>
        <div className="border border-neutral-200 rounded p-3 overflow-auto">
          <div className="font-medium mb-2">Properties</div>
          {selectedLayer ? (
            <div className="flex flex-col gap-3">
              {SelectedStyleControls}
            </div>
          ) : (
            <div className="text-neutral-500">Select a text layer to edit its properties</div>
          )}
        </div>
      </div>
    </div>
  );
}

