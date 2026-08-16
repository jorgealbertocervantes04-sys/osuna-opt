// authService.js
import { supabase } from './supabaseClient';

export const authService = {
  // ==========================================
  // LOGIN ADMIN / DIRECTIVOS (ya seguro, sin cambios)
  // ==========================================
  async loginAdmin(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .in('rol', ['Admin', 'General'])
        .maybeSingle();

      if (perfilError) throw perfilError;
      if (!perfil) {
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de administrador o directivo.');
      }

      localStorage.setItem('udat_app_session', JSON.stringify(perfil));
      return { exito: true, datos: perfil };
    } catch (error) {
      console.error("Error en loginAdmin:", error.message);
      return { exito: false, mensaje: error.message };
    }
  },

  // ==========================================
  // VERIFICAR CELULAR (ahora vía RPC, sin exponer la tabla completa)
  // ==========================================
  async verificarCelular(numeroCelular) {
    try {
      const celularLimpio = String(numeroCelular).trim();

      let { data, error } = await supabase.rpc('verificar_celular', {
        p_celular: celularLimpio,
      });
      if (error) throw error;

      if (!data.exito) {
        const intentoConPrefijo = `52${celularLimpio}`;
        const { data: dataPrefijo, error: errorPrefijo } = await supabase.rpc('verificar_celular', {
          p_celular: intentoConPrefijo,
        });
        if (errorPrefijo) throw errorPrefijo;
        data = dataPrefijo;
      }

      if (data.exito) {
        return { exito: true, datos: data.datos };
      } else {
        return { exito: false, mensaje: `El número ${celularLimpio} no coincide con ningún registro activo.` };
      }
    } catch (error) {
      console.error("Error al verificar celular:", error.message);
      return { exito: false, mensaje: "Error de conexión con la base de datos." };
    }
  },

  // ==========================================
  // LOGIN POR CELULAR (nuevo: valida la contraseña en el servidor)
  // ==========================================
  async loginPorCelular(numeroCelular, password) {
    try {
      const { data, error } = await supabase.rpc('login_por_celular', {
        p_celular: String(numeroCelular).trim(),
        p_password: password,
      });
      if (error) throw error;

      if (data.exito) {
        localStorage.setItem('udat_app_session', JSON.stringify(data.datos));
        return { exito: true, datos: data.datos };
      }
      return { exito: false, mensaje: data.mensaje };
    } catch (error) {
      console.error("Error en loginPorCelular:", error.message);
      return { exito: false, mensaje: "Error de conexión con la base de datos." };
    }
  },

  // ==========================================
  // ACTIVAR CUENTA (ahora vía RPC: anon ya no tiene acceso directo a 'usuarios')
  // ==========================================
  async activarCuenta(id, payload) {
    try {
      const { contrasena, generacion, nombre_completo, numero_empleado, empresa,
        unidad_negocio, lider, gerente, tutor, fecha_registro } = payload;

      const { data, error } = await supabase.rpc('completar_perfil', {
        p_user_id: id,
        p_generacion: generacion,
        p_nombre_completo: nombre_completo,
        p_numero_empleado: numero_empleado,
        p_empresa: empresa,
        p_unidad_negocio: unidad_negocio,
        p_lider: lider,
        p_gerente: gerente,
        p_tutor: tutor,
        p_fecha_registro: fecha_registro,
      });
      if (error) throw error;
      if (!data.exito) throw new Error(data.mensaje);

      if (contrasena) {
        const { error: pwError } = await supabase.rpc('set_password', {
          p_user_id: id,
          p_new_password: contrasena,
        });
        if (pwError) throw pwError;
      }

      localStorage.setItem('udat_app_session', JSON.stringify(data.datos));
      return { exito: true, datos: data.datos };
    } catch (error) {
      console.error("Error en activarCuenta:", error.message);
      return { exito: false, mensaje: "No se pudo registrar la información." };
    }
  },

  // ==========================================
  // LOGOUT
  // ==========================================
  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('udat_app_session');
  }
};
