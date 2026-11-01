import { useEffect, useState } from 'react';
import { fetchDreamSigns } from '../lib/dreamSigns';
import { useAuth } from './useAuth';
import { useDreams } from './useDreams';

export function useDreamSigns() {
  const { user } = useAuth();
  const { dreams, isLoading: dreamsLoading } = useDreams();
  const [dreamSigns, setDreamSigns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Re-runs whenever the journal changes; fetchDreamSigns is cached, so this only reaches
  // Claude when one of the last 14 entries is new or edited.
  useEffect(() => {
    if (!user || dreamsLoading) return;
    let ignore = false;
    fetchDreamSigns(user.id).then((signs) => {
      if (ignore) return;
      setDreamSigns(signs);
      setIsLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, [user, dreams, dreamsLoading]);

  return { dreamSigns, isLoading };
}
