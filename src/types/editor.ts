export type EditorImage = {
  element: HTMLImageElement | null;
  width: number;
  height: number;
};

export type TextAlign = "left" | "center" | "right";

export type TextLayer = {
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

export type ClientRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
