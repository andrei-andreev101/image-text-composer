import { useEffect, useRef } from 'react';
import type { TextLayer } from '@/types/editor';

export type AutosaveData = {
  layers: TextLayer[];
  imageUrl: string | null;
  stageSize: { width: number; height: number };
  stageScale: number;
  timestamp: number;
  hasImage: boolean; // Track if there was an image, but don't save the URL
};

const AUTOSAVE_KEY = 'png-editor-autosave';
const AUTOSAVE_DELAY = 2000; // 2 seconds

export function useAutosave(
  layers: TextLayer[],
  imageUrl: string | null,
  stageSize: { width: number; height: number },
  stageScale: number,
  onAutosave?: () => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage
  const saveToStorage = (data: AutosaveData) => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      console.log('Autosave: Design saved to localStorage');
    } catch (error) {
      console.error('Autosave: Failed to save to localStorage', error);
    }
  };

  // Load from localStorage
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

  // Clear autosave data
  const clearAutosave = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      console.log('Autosave: Design data cleared from localStorage');
    } catch (error) {
      console.error('Autosave: Failed to clear localStorage', error);
    }
  };

  // Debounced autosave
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const data: AutosaveData = {
        layers,
        imageUrl: null, // Don't save the actual URL as it might be a blob URL
        stageSize,
        stageScale,
        timestamp: Date.now(),
        hasImage: !!imageUrl, // Track if there was an image
      };
      saveToStorage(data);
      onAutosave?.(); // Call the callback if provided
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
