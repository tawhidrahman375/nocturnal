import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { track } from '../lib/analytics';
import { categoriseDream } from '../lib/dreamCategories';
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
    const { data: inserted, error: insertError } = await supabase
      .from('dreams')
      .insert({ ...dream, user_id: user.id, dreamed_at: localDateString(new Date()) })
      .select('id')
      .single();
    if (insertError) return { error: insertError.message };
    await refresh();
    // Fire and forget: the badge fills in when the category arrives, and a failure just
    // leaves it null. Started after the refresh so that fetch can't overwrite the patch.
    const isLucid = dream.is_lucid ?? false;
    categoriseDream({ dreamId: inserted.id, content: dream.content ?? '', isLucid })
      .then((category) => {
        track('dream_logged', { is_lucid: isLucid, category });
        if (!category) return;
        setDreams((current) => current.map((d) => (d.id === inserted.id ? { ...d, category } : d)));
      })
      .catch(() => track('dream_logged', { is_lucid: isLucid, category: null }));
    // New tags may have introduced fresh dream signs; keep reminder copy up to date.
    refreshRealityCheckSchedule(user.id).catch(() => {});
    // Today's entry may extend (or start) the journalling streak.
    refreshStreakForUser(user.id).catch(() => {});
    return { error: null };
  };

  return { dreams, isLoading, error, refresh, addDream };
}
