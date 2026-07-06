import { supabase } from './supabaseClient';

export const dataService = {
  obtenerUsuariosPorRol,
  registrarViaje,
  obtenerAvanceInduccion,
  obtenerviajes(filtros = {}) {
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

  /**
   * Obtiene los catálogos para los menús desplegables del panel.
   * Corrección realizada: 'getentes' cambiado a 'gerentes'.
   */
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

  async obtenerUsuarios(filtros = {}) {
    let query = supabase.from('usuarios').select('*');
    if (filtros.rol) query = query.eq('rol', filtros.rol);
    const { data } = await query.order('nombre_completo', { ascending: true });
    return data || [];
  },

  async guardarUsuario(datos, id = null) {
    if (id) {
      const { error } = await supabase.from('usuarios').update(datos).eq('id', id);
      return { exito: !error, error };
    } else {
      const { error } = await supabase.from('usuarios').insert([datos]);
      return { exito: !error, error };
    }
  }
};
