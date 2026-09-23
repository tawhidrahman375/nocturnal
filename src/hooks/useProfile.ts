import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/database';
import { useAuth } from './useAuth';

type Profile = Tables<'profiles'>;

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setIsLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;

    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (ignore) return;
      setProfile(data);
      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [user]);

  return { profile, isLoading, refresh };
}
