import { useState, useRef, useCallback } from "react";

function useUndoRedo<T>(
  initialValue: T,
  onChange?: (value: T) => void,
  limit = 1000
) {
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);

  const setValue = useCallback(
    (newValue: T) => {
      pastRef.current.push(present);
      if (pastRef.current.length > limit) {
        pastRef.current.shift();
      }
      setPresent(newValue);
      futureRef.current = [];
      if (onChange) onChange(newValue);
    },
    [present, onChange, limit]
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    const previous = pastRef.current.pop()!;
    futureRef.current.unshift(present);
    setPresent(previous);
    if (onChange) onChange(previous);
  }, [present, onChange]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.shift()!;
    pastRef.current.push(present);
    setPresent(next);
    if (onChange) onChange(next);
  }, [present, onChange]);

  return { value: present, setValue, undo, redo };
}

export default useUndoRedo;
