import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { refreshStreakForUser } from '../lib/streaks';
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
    await refreshStreakForUser(user.id).catch(() => {});
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(data);
    setIsLoading(false);
  }, [user]);

  // Reconciled on every focus (not just once) so a streak broken by a missed day
  // shows as broken the next time the user looks, not only after their next entry.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let ignore = false;

      (async () => {
        await refreshStreakForUser(user.id).catch(() => {});
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (ignore) return;
        setProfile(data);
        setIsLoading(false);
      })();

      return () => {
        ignore = true;
      };
    }, [user])
  );

  return { profile, isLoading, refresh };
}
