import { useState,useEffect } from 'react';
function useUndoRedo<T>(initialValue: T, onChange?: (value: T) => void) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);
  const [future, setFuture] = useState<T[]>([]);

  useEffect(() => {
    setPresent(initialValue);
    setPast([]);
    setFuture([]);
  }, [initialValue]);

  const setValue = (newValue: T) => {
    setPast((prevPast) => [...prevPast, present]);
    setPresent(newValue);
    setFuture([]);
    if (onChange) onChange(newValue); // Ensure preview updates
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prevPast) => prevPast.slice(0, -1));
    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
    if (onChange) onChange(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prevFuture) => prevFuture.slice(1));
    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
    if (onChange) onChange(next);
  };

  return { value: present, setValue, undo, redo };
}

export default useUndoRedo;
