import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dataService = {
  obtenerAsistencias: async () => {
    const { data, error } = await supabase.from('asistencias').select('*');
    if (error) throw error;
    return data;
  },
};