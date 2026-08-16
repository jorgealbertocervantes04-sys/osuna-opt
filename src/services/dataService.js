import { supabase } from './supabaseClient';

export const dataService = {
  // ==========================================
  // USUARIOS (panel Admin — usa sesión real de Supabase Auth, sin cambios)
  // ==========================================
  async obtenerUsuarios(filtros = {}, page = null, limit = 50) {
    try {
      let query = supabase.from('usuarios').select('*', { count: 'exact' });
      if (filtros.rol) query = query.eq('rol', filtros.rol);
      query = query.order('nombre_completo', { ascending: true });
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
  // VIAJES (alumno/operador → RPC; admin sigue leyendo la tabla directo)
  // ==========================================
  async registrarViaje(datosViaje) {
    try {
      const { data, error } = await supabase.rpc('registrar_viaje', {
        p_id_alumno: datosViaje.id_alumno,
        p_id_operador: datosViaje.id_operador ?? null,
        p_km_recorridos: datosViaje.km_recorridos,
        p_tiempo_total_minutos: datosViaje.tiempo_total_minutos,
        p_hora_inicio: datosViaje.hora_inicio,
        p_fecha: datosViaje.fecha,
        p_hora_inicio_manual: datosViaje.hora_inicio_manual ?? null,
        p_hora_fin_manual: datosViaje.hora_fin_manual ?? null,
        p_hora_fin: datosViaje.hora_fin ?? null,
        p_notas_novedad: datosViaje.notas_novedad ?? null,
        p_nombre_opt: datosViaje.nombre_opt ?? null,
        p_km_iniciales: datosViaje.km_iniciales,
        p_km_finales: datosViaje.km_finales,
        p_opt_calif_trato: datosViaje.opt_calif_trato ?? null,
        p_opt_calif_instruccion: datosViaje.opt_calif_instruccion ?? null,
        p_foto_odometro_url: datosViaje.foto_odometro_url ?? null,
        p_foto_inicio_url: datosViaje.foto_inicio_url ?? null,
      });
      if (error) throw error;
      if (!data.exito) return { exito: false, error: data.mensaje };
      return { exito: true, data: [data.datos] };
    } catch (error) {
      console.error("Error al registrar viaje:", error.message);
      return { exito: false, error: error.message };
    }
  },

  // Para el panel Admin: sigue leyendo la tabla directo (ya tiene política propia)
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

  // Para la vista Alumno: vía RPC (sin sesión real de Supabase Auth)
  async obtenerViajesPorAlumno(id_alumno, desde = null, hasta = null) {
    try {
      const { data, error } = await supabase.rpc('obtener_viajes_alumno', {
        p_id_alumno: id_alumno,
        p_desde: desde,
        p_hasta: hasta,
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error en obtenerViajesPorAlumno:", error.message);
      return [];
    }
  },

  // ==========================================
  // INDUCCIÓN (vía RPC)
  // ==========================================
  async obtenerAvanceInduccion(id_alumno) {
    try {
      const { data, error } = await supabase.rpc('obtener_induccion_alumno', {
        p_id_alumno: id_alumno,
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error al obtener avance de inducción:", error.message);
      return [];
    }
  },

  async registrarAvanceInduccion(datosInduccion) {
    try {
      const { data, error } = await supabase.rpc('registrar_induccion', {
        p_id_alumno: datosInduccion.id_alumno,
        p_detalles: datosInduccion.detalles ?? null,
        p_duracion_minutos: datosInduccion.duracion_minutos ?? null,
        p_tema_visto: datosInduccion.tema_visto ?? null,
      });
      if (error) throw error;
      if (!data.exito) return { exito: false, error: data.mensaje };
      return { exito: true, data: [data.datos] };
    } catch (error) {
      console.error("Error al registrar inducción:", error.message);
      return { exito: false, error: error.message };
    }
  },

  // ==========================================
  // PROGRESO SEMANAL (evaluación del tutor — vía RPC)
  // ==========================================
  async registrarProgresoSemanal(datos) {
    try {
      const { data, error } = await supabase.rpc('registrar_progreso_semanal', {
        p_id_alumno: datos.id_alumno,
        p_semana: datos.semana,
        p_calificacion_examen: datos.calificacion_examen ?? null,
        p_evaluacion_tutor: datos.evaluacion_tutor ?? null,
      });
      if (error) throw error;
      if (!data.exito) return { exito: false, error: data.mensaje };
      return { exito: true, data: [data.datos] };
    } catch (error) {
      console.error("Error al registrar progreso semanal:", error.message);
      return { exito: false, error: error.message };
    }
  },

  async obtenerProgresoAlumno(id_alumno) {
    try {
      const { data, error } = await supabase.rpc('obtener_progreso_alumno', {
        p_id_alumno: id_alumno,
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error al obtener progreso del alumno:", error.message);
      return [];
    }
  },

  // ==========================================
  // ASISTENCIAS (checkin — vía RPC; lectura solo Admin)
  // ==========================================
  async registrarAsistencia(datos) {
    try {
      const { data, error } = await supabase.rpc('registrar_asistencia', {
        p_id_usuario: datos.id_usuario,
        p_ubicacion: datos.ubicacion ?? null,
        p_actividad_sin_manejo: datos.actividad_sin_manejo ?? null,
        p_latitud: datos.latitud ?? null,
        p_longitud: datos.longitud ?? null,
        p_ubicacion_texto: datos.ubicacion_texto ?? null,
      });
      if (error) throw error;
      if (!data.exito) return { exito: false, error: data.mensaje };
      return { exito: true, data: [data.datos] };
    } catch (error) {
      console.error("Error al registrar asistencia:", error.message);
      return { exito: false, error: error.message };
    }
  },

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
  // CATÁLOGOS (sin cambios; si el dropdown de Gerentes sale vacío,
  // revisar el nombre real de la tabla: puede ser 'cat_Gerentes' con mayúscula)
  // ==========================================
  async obtenerCatalogos() {
    try {
      const [resUni, resLid, resGer, resTut] = await Promise.all([
        supabase.from('cat_unidades').select('nombre'),
        supabase.from('cat_lideres').select('nombre'),
        supabase.from('cat_gerentes').select('nombre'),
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
  // MATERIAL DE ESTUDIO (lectura abierta, sin cambios)
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
  // EXÁMENES (lectura abierta / escritura Admin, sin cambios)
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
  // ENCUESTAS DE SATISFACCIÓN (insertar sigue abierto; leer ahora solo Admin)
  // ==========================================
  async obtenerEncuestas() {
    try {
      const { data, error } = await supabase
        .from('encuestas_satisfaccion')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo encuestas:", error.message);
      return [];
    }
  },

  async guardarEncuesta(datosEncuesta) {
    try {
      const { data, error } = await supabase
        .from('encuestas_satisfaccion')
        .insert([datosEncuesta])
        .select();
      if (error) throw error;
      return { exito: true, data };
    } catch (error) {
      console.error("Error al guardar encuesta:", error.message);
      return { exito: false, error: error.message };
    }
  },

  // ==========================================
  // EVALUACIONES (Cardex) — Admin, sin cambios
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
