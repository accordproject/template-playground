import { useState } from 'react';

function useUndoRedo<T>(initialValue: T, onChange?: (value: T) => void, onSync?: (value: T) => Promise<void>) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);
  const [future, setFuture] = useState<T[]>([]);

  // Reset function to clear history and set current value
  const reset = (value: T) => {
    setPast([]);
    setPresent(value);
    setFuture([]);
    if (onChange) onChange(value);
    if (onSync) onSync(value).then(() => {
      // After syncing, ensure the present value is updated
      setPresent(value);
    }).catch(console.error);
  };

  const setValue = (newValue: T) => {
    setPast((prevPast) => [...prevPast, present]);
    setPresent(newValue);
    setFuture([]);
    if (onChange) onChange(newValue); // Update editor state
    if (onSync) onSync(newValue); // Sync to main state and rebuild
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prevPast) => prevPast.slice(0, -1));
    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
    if (onChange) onChange(previous); // Update editor state
    if (onSync) onSync(previous); // Sync to main state and rebuild
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prevFuture) => prevFuture.slice(1));
    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
    if (onChange) onChange(next); // Update editor state
    if (onSync) onSync(next); // Sync to main state and rebuild
  };

  return { value: present, setValue, undo, redo, reset };
}

export default useUndoRedo;