import { useEffect, useRef } from 'react';
import type { TextLayer } from '@/types/editor';

export type AutosaveData = {
  layers: TextLayer[];
  imageUrl: string | null;
  stageSize: { width: number; height: number };
  stageScale: number;
  timestamp: number;
  hasImage: boolean;
};

const AUTOSAVE_KEY = 'png-editor-autosave';
const AUTOSAVE_DELAY = 2000;

export function useAutosave(
  layers: TextLayer[],
  imageUrl: string | null,
  stageSize: { width: number; height: number },
  stageScale: number,
  onAutosave?: () => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveToStorage = (data: AutosaveData) => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      console.log('Autosave: Design saved to localStorage');
    } catch (error) {
      console.error('Autosave: Failed to save to localStorage', error);
    }
  };

  const loadFromStorage = (): AutosaveData | null => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as AutosaveData;
        console.log('Autosave: Design loaded from localStorage');
        return data;
      }
    } catch (error) {
      console.error('Autosave: Failed to load from localStorage', error);
    }
    return null;
  };

  const clearAutosave = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      console.log('Autosave: Design data cleared from localStorage');
    } catch (error) {
      console.error('Autosave: Failed to clear localStorage', error);
    }
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const data: AutosaveData = {
        layers,
        imageUrl: null,        stageSize,
        stageScale,
        timestamp: Date.now(),
        hasImage: !!imageUrl,
      };
      saveToStorage(data);
      onAutosave?.();
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [layers, imageUrl, stageSize, stageScale]);

  return {
    loadFromStorage,
    clearAutosave,
  };
}
