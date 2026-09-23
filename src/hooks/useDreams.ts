import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tables, TablesInsert } from '../types/database';
import { useAuth } from './useAuth';

export type Dream = Tables<'dreams'>;
type NewDream = Pick<TablesInsert<'dreams'>, 'title' | 'content' | 'is_lucid'>;

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
      .insert({ ...dream, user_id: user.id });
    if (insertError) return { error: insertError.message };
    await refresh();
    return { error: null };
  };

  return { dreams, isLoading, error, refresh, addDream };
}
