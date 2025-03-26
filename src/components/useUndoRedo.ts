import { useState, useRef, useCallback, useEffect } from "react";
import { debounce } from "ts-debounce";

function useUndoRedo<T>(
  initialValue: T,
  onChange?: (value: T) => void,
  limit = 1000,
  debounceDelay = 300
) {
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);

  useEffect(() => {
    setPresent(initialValue);
    pastRef.current = [];
    futureRef.current = [];
  }, [initialValue]);

  const debouncedSetValue = useCallback(
    debounce((newValue: T) => {
      pastRef.current.push(present);
      if (pastRef.current.length > limit) {
        pastRef.current.shift(); 
      }
      setPresent(newValue);
      futureRef.current = [];
      if (onChange) onChange(newValue); 
    }, debounceDelay),
    [present, limit, onChange, debounceDelay]
  );

  const setValue = useCallback(
    (newValue: T) => {
      void debouncedSetValue(newValue); 
    },
    [debouncedSetValue]
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
