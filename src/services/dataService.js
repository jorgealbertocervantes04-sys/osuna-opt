import { supabase } from './supabaseClient';

export const dataService = {
  // ==========================================
  // USUARIOS (Directorio, Alumnos, Tutores)
  // ==========================================
  async obtenerUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre_completo', { ascending: true });
    if (error) console.error("Error obteniendo usuarios:", error);
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
  },

  async eliminarUsuario(id) {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    return { exito: !error, error };
  },

  // ==========================================
  // VIAJES Y BITÁCORAS
  // ==========================================
  async obtenerViajes() {
    const { data, error } = await supabase
      .from('viajes_diarios')
      .select('*')
      .order('hora_inicio', { ascending: false });
    if (error) console.error("Error obteniendo viajes:", error);
    return data || [];
  },

  async guardarViaje(datos, id = null) {
    if (id) {
      const { error } = await supabase.from('viajes_diarios').update(datos).eq('id', id);
      return { exito: !error, error };
    } else {
      const { data, error } = await supabase.from('viajes_diarios').insert([datos]).select();
      return { exito: !error, error, data };
    }
  },

  async eliminarViaje(id) {
    const { error } = await supabase.from('viajes_diarios').delete().eq('id', id);
    return { exito: !error, error };
  },

  // ==========================================
  // EVALUACIONES Y RÚBRICAS
  // ==========================================
  async obtenerEvaluaciones() {
    const { data, error } = await supabase
      .from('evaluaciones_cardex')
      .select('*')
      .order('fecha_evaluacion', { ascending: false });
    if (error) console.error("Error obteniendo evaluaciones:", error);
    return data || [];
  },

  async guardarEvaluacion(datos, id = null) {
    if (id) {
      const { error } = await supabase.from('evaluaciones_cardex').update(datos).eq('id', id);
      return { exito: !error, error };
    } else {
      const { error } = await supabase.from('evaluaciones_cardex').insert([datos]);
      return { exito: !error, error };
    }
  },

  async eliminarEvaluacion(id) {
    const { error } = await supabase.from('evaluaciones_cardex').delete().eq('id', id);
    return { exito: !error, error };
  },

  // ==========================================
  // ASISTENCIAS (GPS)
  // ==========================================
  async obtenerAsistencias() {
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .order('fecha_hora', { ascending: false });
    if (error) console.error("Error obteniendo asistencias:", error);
    return data || [];
  },

  async registrarAsistencia(datos) {
    const { error } = await supabase.from('asistencias').insert([datos]);
    return { exito: !error, error };
  },

  // ==========================================
  // ENCUESTAS DE SATISFACCIÓN
  // ==========================================
  async obtenerEncuestas() {
    const { data, error } = await supabase
      .from('encuestas_satisfaccion')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    if (error) console.error("Error obteniendo encuestas:", error);
    return data || [];
  },

  async guardarEncuesta(datos) {
    const { error } = await supabase.from('encuestas_satisfaccion').insert([datos]);
    return { exito: !error, error };
  },

  // ==========================================
  // ACADEMIA (Materiales y Exámenes)
  // ==========================================
  async obtenerMaterialEstudio() {
    const { data, error } = await supabase
      .from('material_estudio')
      .select('*')
      .order('semana_asignada', { ascending: true });
    if (error) console.error("Error obteniendo material:", error);
    return data || [];
  },

  async guardarMaterial(datos, id = null) {
    if (id) {
      const { error } = await supabase.from('material_estudio').update(datos).eq('id', id);
      return { exito: !error, error };
    } else {
      const { error } = await supabase.from('material_estudio').insert([datos]);
      return { exito: !error, error };
    }
  },

  async eliminarMaterial(id) {
    const { error } = await supabase.from('material_estudio').delete().eq('id', id);
    return { exito: !error, error };
  },

  async obtenerExamenes() {
    const { data, error } = await supabase
      .from('resultados_examenes')
      .select('*')
      .order('fecha_realizacion', { ascending: false });
    if (error) console.error("Error obteniendo exámenes:", error);
    return data || [];
  },

  async guardarExamen(datos) {
    const { error } = await supabase.from('resultados_examenes').insert([datos]);
    return { exito: !error, error };
  },

  // --- NUEVAS FUNCIONES PARA LOS CATÁLOGOS Y PERFIL ---
  obtenerCatalogos: async () => {
    try {
      const [resUni, resLid, resGer] = await Promise.all([
        supabase.from('cat_unidades').select('nombre'),
        supabase.from('cat_lideres').select('nombre'),
        supabase.from('cat_gerentes').select('nombre')
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

  actualizarPerfilAlumno: async function (id_alumno, perfilData) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          ...perfilData,
          fecha_actualizacion_perfil: new Date().toISOString()
        })
        .eq('id', id_alumno);

      if (error) throw error;
      return { exito: true };
    } catch (error) {
      return { exito: false, error };
    }
  }
};