import { useMemo } from 'react';
import { extractDreamSigns } from '../lib/dreamSigns';
import { useDreams } from './useDreams';

export function useDreamSigns() {
  const { dreams, isLoading } = useDreams();
  const dreamSigns = useMemo(() => extractDreamSigns(dreams), [dreams]);
  return { dreamSigns, isLoading };
}
