import { useState, useEffect, useRef } from 'react';

function useUndoRedo<T>(initialValue: T, onChange?: (value: T) => void, onSync?: (value: T) => Promise<void>) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);
  const [future, setFuture] = useState<T[]>([]);
  const isInitialMount = useRef(true);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    if (initialValue !== present) {
      setPast((prevPast) => [...prevPast, present]);
      setPresent(initialValue);
      setFuture([]);

      if (onChange) onChange(initialValue);
      if (onSync) onSync(initialValue);
    }
  }, [initialValue, present]);

  useEffect(() => {
    if (initialValue !== present) {
      setPresent(initialValue);
      setPast([]);
      setFuture([]);
    }
  }, [initialValue, present]);

  const setValue = (newValue: T) => {
    isInternalChange.current = true;
    setPast((prevPast) => [...prevPast, present]);
    setPresent(newValue);
    setFuture([]);
    if (onChange) onChange(newValue); // Update editor state
    if (onSync) void onSync(newValue);
  };

  const undo = () => {
    if (past.length === 0) return;
    isInternalChange.current = true;
    const previous = past[past.length - 1];
    setPast((prevPast) => prevPast.slice(0, -1));
    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
    if (onChange) onChange(previous);
    if (onSync) void onSync(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    isInternalChange.current = true;
    const next = future[0];
    setFuture((prevFuture) => prevFuture.slice(1));
    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
    if (onChange) onChange(next);
    if (onSync) void onSync(next);
  };

  return { value: present, setValue, undo, redo };
}

export default useUndoRedo;