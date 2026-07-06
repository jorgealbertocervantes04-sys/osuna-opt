import { supabase } from './supabaseClient';

export const dataService = {
  
  // ==========================================
  // 1. OBTENER USUARIOS POR ROL
  // ==========================================
  async obtenerUsuariosPorRol(rol) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', rol)
        .order('nombre_completo', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error obteniendo usuarios con rol ${rol}:`, error.message);
      return [];
    }
  },

  // ==========================================
  // 2. REGISTRAR UN NUEVO VIAJE (OPT)
  // ==========================================
  async registrarViaje(datosViaje) {
    try {
      const { data, error } = await supabase
        .from('viajes_diarios')
        .insert([datosViaje])
        .select();
      if (error) throw error;
      return { exito: true, data };
    } catch (error) {
      console.error("Error al registrar viaje:", error.message);
      return { exito: false, error: error.message };
    }
  },

  // ==========================================
  // 3. OBTENER Y REGISTRAR AVANCES DE INDUCCIÓN
  // ==========================================
  async obtenerAvanceInduccion(id_alumno) {
    try {
      const { data, error } = await supabase
        .from('registros_induccion')
        .select('*')
        .eq('id_alumno', id_alumno)
        .order('fecha_registro', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error al obtener avance de inducción:", error.message);
      return [];
    }
  },

  async registrarAvanceInduccion(datosInduccion) {
    try {
      const { data, error } = await supabase
        .from('registros_induccion')
        .insert([datosInduccion])
        .select();
      if (error) throw error;
      return { exito: true, data };
    } catch (error) {
      console.error("Error al registrar inducción:", error.message);
      return { exito: false, error: error.message };
    }
  },

  // ==========================================
  // 4. OBTENER HISTORIAL DE VIAJES (Con filtros)
  // ==========================================
  async obtenerViajes(filtros = {}) {
    try {
      let query = supabase.from('viajes_diarios').select('*');

      if (filtros.desde) query = query.gte('hora_inicio', filtros.desde);
      if (filtros.hasta) query = query.lte('hora_inicio', filtros.hasta);
      if (filtros.id_operador) query = query.eq('id_operador', filtros.id_operador);

      // Paginación de seguridad para evitar Error 500 o Timeouts
      if (!filtros.desde && !filtros.hasta && !filtros.sinLimite) {
        query = query.range(0, 49); // Trae los 50 registros más recientes
      }

      const { data, error } = await query.order('hora_inicio', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en obtenerViajes:", error.message);
      return [];
    }
  },

  // ==========================================
  // 5. OBTENER CATÁLOGOS (Menús desplegables)
  // ==========================================
  async obtenerCatalogos() {
    try {
      const [resUni, resLid, resGer] = await Promise.all([
        supabase.from('cat_unidades').select('nombre'),
        supabase.from('cat_lideres').select('nombre'),
        supabase.from('usuarios').select('nombre_completo').eq('rol', 'Gerente')
      ]);

      return {
        unidades: resUni.data || [],
        lideres: resLid.data || [],
        gerentes: resGer.data || [] 
      };
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      return { unidades: [], lideres: [], gerentes: [] };
    }
  },

  // ==========================================
  // 6. GESTIÓN GENERAL DE USUARIOS
  // ==========================================
  async obtenerUsuarios(filtros = {}) {
    try {
      let query = supabase.from('usuarios').select('*');
      if (filtros.rol) query = query.eq('rol', filtros.rol);
      
      const { data, error } = await query.order('nombre_completo', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en obtenerUsuarios:", error.message);
      return [];
    }
  },

  async guardarUsuario(datos, id = null) {
    try {
      if (id) {
        const { error } = await supabase.from('usuarios').update(datos).eq('id', id);
        return { exito: !error, error };
      } else {
        const { error } = await supabase.from('usuarios').insert([datos]);
        return { exito: !error, error };
      }
    } catch (error) {
      console.error("Error en guardarUsuario:", error.message);
      return { exito: false, error: error.message };
    }
  }
};