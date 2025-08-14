import { useState, useEffect } from "react";
import type { EditorImage } from "@/types/editor";

export function useImageObject(url: string | null) {
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
    
    img.onerror = (error) => {
      console.error("useImageObject: Image failed to load", error);
      setImage({ element: null, width: 0, height: 0 });
    };
    
    img.src = url;
    
    return () => {
      setImage({ element: null, width: 0, height: 0 });
    };
  }, [url]);

  return image;
}
