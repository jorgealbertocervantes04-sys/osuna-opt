// dataService.js
import { supabase } from './supabaseClient';

export const dataService = {
  // ==========================================
  // USUARIOS
  // ==========================================
  async obtenerUsuarios(filtros = {}, page = null, limit = 50) {
    try {
      let query = supabase.from('usuarios').select('*', { count: 'exact' });
      if (filtros.rol) query = query.eq('rol', filtros.rol);
      // ordenar por nombre
      query = query.order('nombre_completo', { ascending: true });
      // paginación opcional
      if (page && Number.isInteger(page) && page > 0) {
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
      }
      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data || [], total: count ?? (data ? data.length : 0) };
    } catch (error) {
      console.error("Error en obtenerUsuarios:", error.message);
      return { data: [], total: 0 };
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
  },

  // ==========================================
  // VIAJES
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

  async obtenerViajes(filtros = {}) {
    try {
      let query = supabase.from('viajes_diarios').select('*');
      if (filtros.desde) query = query.gte('hora_inicio', filtros.desde);
      if (filtros.hasta) query = query.lte('hora_inicio', filtros.hasta);
      if (filtros.id_alumno) query = query.eq('id_alumno', filtros.id_alumno);
      const { data, error } = await query.order('hora_inicio', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en obtenerViajes:", error.message);
      return [];
    }
  },

  async obtenerViajesPorAlumno(id_alumno) {
    return this.obtenerViajes({ id_alumno });
  },

  // ==========================================
  // INDUCCIÓN
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
  // CATÁLOGOS (nombres en minúscula)
  // ==========================================
  async obtenerCatalogos() {
    try {
      const [resUni, resLid, resGer, resTut] = await Promise.all([
        supabase.from('cat_unidades').select('nombre'),
        supabase.from('cat_lideres').select('nombre'),
        supabase.from('cat_gerentes').select('nombre'),   // 🔥 minúscula
        supabase.from('cat_tutores').select('nombre')
      ]);
      return {
        unidades: resUni.data || [],
        lideres: resLid.data || [],
        gerentes: resGer.data || [],
        tutores: resTut.data || []
      };
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      return { unidades: [], lideres: [], gerentes: [], tutores: [] };
    }
  },

  // ==========================================
  // MATERIAL DE ESTUDIO
  // ==========================================
  async obtenerMaterialEstudio() {
    try {
      const { data, error } = await supabase
        .from('material_estudio')
        .select('*')
        .order('semana_asignada', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en obtenerMaterialEstudio:", error.message);
      return [];
    }
  },

  // ==========================================
  // EXÁMENES
  // ==========================================
  async obtenerExamenes() {
    try {
      const { data, error } = await supabase
        .from('examenes')
        .select('*')
        .order('fecha_realizacion', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en obtenerExamenes:", error.message);
      return [];
    }
  },

  async guardarExamen(datosExamen) {
    try {
      const { data, error } = await supabase
        .from('examenes')
        .insert([datosExamen])
        .select();
      if (error) throw error;
      return { exito: true, data };
    } catch (error) {
      console.error("Error en guardarExamen:", error.message);
      return { exito: false, error: error.message };
    }
  },

  async actualizarExamen(id, datos) {
    try {
      const { error } = await supabase
        .from('examenes')
        .update(datos)
        .eq('id', id);
      return { exito: !error, error };
    } catch (error) {
      console.error("Error en actualizarExamen:", error.message);
      return { exito: false, error: error.message };
    }
  },

  async eliminarExamen(id) {
    try {
      const { error } = await supabase
        .from('examenes')
        .delete()
        .eq('id', id);
      return { exito: !error, error };
    } catch (error) {
      console.error("Error en eliminarExamen:", error.message);
      return { exito: false, error: error.message };
    }
  },

  // ==========================================
  // ASISTENCIAS
  // ==========================================
  async obtenerAsistencias() {
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo asistencias:", error.message);
      return [];
    }
  },

  // ==========================================
  // ENCUESTAS
  // ==========================================
  async obtenerEncuestas() {
    try {
      const { data, error } = await supabase
        .from('encuestas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo encuestas:", error.message);
      return [];
    }
  },

  // ==========================================
  // EVALUACIONES (Cardex)
  // ==========================================
  async obtenerEvaluaciones() {
    try {
      const { data, error } = await supabase
        .from('evaluaciones_cardex')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo evaluaciones:", error.message);
      return [];
    }
  },

  async guardarEvaluacion(payload) {
    try {
      const { data, error } = await supabase
        .from('evaluaciones_cardex')
        .insert([payload])
        .select();
      if (error) throw error;
      return { exito: true, data };
    } catch (error) {
      console.error("Error al guardar la rúbrica del tutor:", error.message);
      return { exito: false, error: error };
    }
  },

  async actualizarEvaluacion(id, payload) {
    try {
      const { error } = await supabase
        .from('evaluaciones_cardex')
        .update(payload)
        .eq('id', id);
      return { exito: !error, error };
    } catch (error) {
      console.error("Error al actualizar evaluación:", error.message);
      return { exito: false, error: error.message };
    }
  },

  async eliminarEvaluacion(id) {
    try {
      const { error } = await supabase
        .from('evaluaciones_cardex')
        .delete()
        .eq('id', id);
      return { exito: !error, error };
    } catch (error) {
      console.error("Error al eliminar evaluación:", error.message);
      return { exito: false, error: error.message };
    }
  }
};