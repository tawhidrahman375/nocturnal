import { useCallback, useState } from 'react';
import { checkForNewDreamSigns } from '../lib/dreamSignReveal';

// Owns the queue of newly-detected dream signs waiting to be revealed, one at a time —
// if a single save introduces several new tags at once, they show sequentially rather
// than all at once.
export function useDreamSignReveal() {
  const [queue, setQueue] = useState<string[]>([]);

  const checkForNewSigns = useCallback(async (userId: string) => {
    const newSigns = await checkForNewDreamSigns(userId);
    if (newSigns.length > 0) setQueue((prev) => [...prev, ...newSigns]);
  }, []);

  const dismissCurrentSign = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return {
    currentSign: queue[0] ?? null,
    checkForNewSigns,
    dismissCurrentSign,
  };
}
