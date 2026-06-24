import { createClient } from '@supabase/supabase-js';

// Asegúrate de tener estas variables en tu archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Esta es la constante que importarás en tus componentes
export const supabase = createClient(supabaseUrl, supabaseAnonKey);