import { createClient } from '@supabase/supabase-js';

// Variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 1. Cliente básico de Supabase para Auth u otras consultas directas
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Servicio de datos requerido por tus componentes (ej. Asistencias.jsx)
export const dataService = {
  
  // Obtiene todos los pases de lista/asistencias ordenados por el más reciente
  async obtenerAsistencias() {
    try {
      const { data, error } = await supabase
        .from('asistencias') // Asegúrate de que tu tabla en Supabase se llame así
        .select('*')
        .order('fecha_hora', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en obtenerAsistencias:', error.message);
      return [];
    }
  },

  // Obtiene el catálogo de usuarios/operadores para cruzar los nombres
  async obtenerUsuarios() {
    try {
      const { data, error } = await supabase
        .from('usuarios') // Asegúrate de que tu tabla en Supabase se llame así
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error en obtenerUsuarios:', error.message);
      return [];
    }
  }
};