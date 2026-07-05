import { createClient } from '@supabase/supabase-js';

// Usamos variables de entorno para mayor seguridad
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Cliente central de Supabase. 
 * Se exporta para ser usado por todos los servicios de la app.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);