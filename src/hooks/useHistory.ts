import { useCallback, useMemo, useState } from "react";

type HistoryEntry<T> = {
  value: T;
  label: string;
};

export function useHistory<T>(initialValue: T, capacity: number = 20) {
  const [past, setPast] = useState<HistoryEntry<T>[]>([]);
  const [present, setPresent] = useState<HistoryEntry<T>>({ value: initialValue, label: "Initial" });
  const [future, setFuture] = useState<HistoryEntry<T>[]>([]);

  const set = useCallback(
    (update: T | ((prev: T) => T), label: string) => {
      setPast((prevPast) => {
        const nextPast = [...prevPast, present];
        return nextPast.length > capacity ? nextPast.slice(nextPast.length - capacity) : nextPast;
      });

      setPresent((prevPresent) => ({
        value: typeof update === "function" ? (update as (prev: T) => T)(prevPresent.value) : update,
        label,
      }));

      setFuture([]);
    },
    [present, capacity]
  );

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      setFuture((prevFuture) => [present, ...prevFuture]);
      setPresent(previous);
      return prevPast.slice(0, prevPast.length - 1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPast((prevPast) => {
        const updated = [...prevPast, present];
        return updated.length > capacity ? updated.slice(updated.length - capacity) : updated;
      });
      setPresent(next);
      return prevFuture.slice(1);
    });
  }, [present, capacity]);

  const jumpTo = useCallback((index: number) => {
    // Build full timeline and re-slice into past/present/future
    setPast((prevPast) => {
      let timeline: HistoryEntry<T>[] = [...prevPast, present];
      let futureSnapshot: HistoryEntry<T>[] = [];
      // We need a snapshot of current future; retrieve via functional updater below
      setFuture((prevFuture) => {
        timeline = [...timeline, ...prevFuture];
        return prevFuture; // no change here; we'll set later
      });

      if (index < 0 || index >= timeline.length) {
        return prevPast; // ignore invalid jump
      }
      const newPast = timeline.slice(0, index);
      const newPresent = timeline[index];
      futureSnapshot = timeline.slice(index + 1);
      setPresent(newPresent);
      setFuture(futureSnapshot);
      return newPast.length > capacity ? newPast.slice(newPast.length - capacity) : newPast;
    });
  }, [present, capacity]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const timeline = useMemo(() => [...past, present, ...future], [past, present, future]);
  const pointer = past.length; // index in timeline of present

  return {
    value: present.value,
    set,
    undo,
    redo,
    jumpTo,
    canUndo,
    canRedo,
    timeline: timeline.map((e) => ({ label: e.label })),
    pointer,
    capacity,
  };
}


