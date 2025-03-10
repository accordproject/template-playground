import { useState } from "react";


function useUndoRedo<T>(initialValue: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialValue);
  const [future, setFuture] = useState<T[]>([]);

  // Function to update the present state and track past states
  const set = (newValue: T) => {
    setPast((prevPast) => [...prevPast, present]);
    setPresent(newValue);
    setFuture([]); // Clear future when new change is made
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prevPast) => prevPast.slice(0, -1));
    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prevFuture) => prevFuture.slice(1));
    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
  };

  return { value: present, set, undo, redo };
}

export default useUndoRedo;