import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { refreshRealityCheckSchedule } from '../lib/realityChecks';
import { localDateString, refreshStreakForUser } from '../lib/streaks';
import { supabase } from '../lib/supabase';
import { Tables, TablesInsert } from '../types/database';
import { useAuth } from './useAuth';

export type Dream = Tables<'dreams'>;
type NewDream = Pick<TablesInsert<'dreams'>, 'title' | 'content' | 'is_lucid' | 'tags'>;

export function useDreams() {
  const { user } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error: fetchError } = await supabase
      .from('dreams')
      .select('*')
      .order('dreamed_at', { ascending: false });

    if (fetchError) setError(fetchError.message);
    else setDreams(data ?? []);
    setIsLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let ignore = false;

      (async () => {
        const { data, error: fetchError } = await supabase
          .from('dreams')
          .select('*')
          .order('dreamed_at', { ascending: false });
        if (ignore) return;
        if (fetchError) setError(fetchError.message);
        else setDreams(data ?? []);
        setIsLoading(false);
      })();

      return () => {
        ignore = true;
      };
    }, [user])
  );

  const addDream = async (dream: NewDream) => {
    if (!user) return { error: 'Not signed in' };
    const { error: insertError } = await supabase
      .from('dreams')
      .insert({ ...dream, user_id: user.id, dreamed_at: localDateString(new Date()) });
    if (insertError) return { error: insertError.message };
    await refresh();
    // New tags may have introduced fresh dream signs; keep reminder copy up to date.
    refreshRealityCheckSchedule(user.id).catch(() => {});
    // Today's entry may extend (or start) the journalling streak.
    refreshStreakForUser(user.id).catch(() => {});
    return { error: null };
  };

  return { dreams, isLoading, error, refresh, addDream };
}
