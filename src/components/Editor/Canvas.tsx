import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from "react-konva";
import Konva from "konva";
import type { TextLayer, EditorImage } from "@/types/editor";

interface CanvasProps {
  background: EditorImage;
  layers: TextLayer[];
  selectedId: string | null;
  editingId: string | null;
  stageSize: { width: number; height: number };
  stageScale: number;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<TextLayer>) => void;
  onTextDblClick: (id: string) => void;
}

export interface CanvasRef {
  exportPNG: () => void;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(({
  background,
  layers,
  selectedId,
  editingId,
  stageSize,
  stageScale,
  onSelectLayer,
  onUpdateLayer,
  onTextDblClick,
}, ref) => {
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    exportPNG: () => {
      if (!stageRef.current || !background.element) return;
      
      // Create a temporary stage for export at original dimensions
      const tempStage = new Konva.Stage({
        container: document.createElement('div'),
        width: background.width,
        height: background.height,
      });
      
      // Create a temporary layer
      const tempLayer = new Konva.Layer();
      tempStage.add(tempLayer);
      
      // Add background image at original size
      const tempImage = new Konva.Image({
        image: background.element,
        width: background.width,
        height: background.height,
        x: 0,
        y: 0,
      });
      tempLayer.add(tempImage);
      
      // Add text layers at original scale positions
      layers.forEach((layer) => {
        const tempText = new Konva.Text({
          text: layer.text,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          draggable: false,
          fill: layer.fill,
          fontSize: layer.fontSize,
          fontFamily: layer.fontFamily,
          fontStyle: layer.fontStyle,
          opacity: layer.opacity,
          align: layer.align,
          rotation: layer.rotation,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
        });
        tempLayer.add(tempText);
      });
      
      // Draw the temporary stage
      tempLayer.draw();
      
      // Export at original dimensions
      const uri = tempStage.toDataURL({
        pixelRatio: 1,
        width: background.width,
        height: background.height
      });
      
      // Clean up temporary stage
      tempStage.destroy();
      
      // Download the image
      const link = document.createElement("a");
      link.download = "design.png";
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }), [background.element, background.width, background.height, layers]);

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

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) onSelectLayer(null);
  };

  const handleTextClick = (id: string) => {
    onSelectLayer(id);
  };

  const handleTextDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const { x, y } = e.target.position();
    onUpdateLayer(id, { x, y });
  };

  const handleTextTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Text;
    const scaleX = node.scaleX();
    const rotation = node.rotation();

    const newWidth = Math.max(20, node.width() * scaleX);

    node.scaleX(1);
    node.scaleY(1);

    onUpdateLayer(id, {
      scaleX: 1,
      scaleY: 1,
      rotation,
      width: newWidth,
    });
  };

  return (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center bg-[#f5f5f5]"
      >
        {background.element ? (
          <Stage
            ref={stageRef}
            width={stageSize.width * stageScale}
            height={stageSize.height * stageScale}
            scaleX={stageScale}
            scaleY={stageScale}
            onMouseDown={handleMouseDown}
          >
            <Layer listening={true}>
              <KonvaImage
                image={background.element}
                width={background.width}
                height={background.height}
              />

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
                  onClick={() => handleTextClick(t.id)}
                  onTap={() => handleTextClick(t.id)}
                  onDblClick={() => onTextDblClick(t.id)}
                  onDragEnd={(e) => handleTextDragEnd(t.id, e)}
                  onTransformEnd={(e) => handleTextTransformEnd(t.id, e)}
                  visible={editingId !== t.id}
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
  );
});

Canvas.displayName = "Canvas";
