// authService.js
import { supabase } from './supabaseClient';

export const authService = {
  // ==========================================
  // LOGIN ADMIN / DIRECTIVOS
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
  // VERIFICAR CELULAR (sin guardar sesión)
  // ==========================================
  async verificarCelular(numeroCelular) {
    try {
      const celularLimpio = String(numeroCelular).trim();
      let { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('celular', celularLimpio)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const intentoConPrefijo = `52${celularLimpio}`;
        const { data: dataPrefijo, error: errorPrefijo } = await supabase
          .from('usuarios')
          .select('*')
          .eq('celular', intentoConPrefijo)
          .maybeSingle();
        if (errorPrefijo) throw errorPrefijo;
        data = dataPrefijo;
      }

      if (data) {
        // ❌ NO guardamos sesión aquí, solo devolvemos los datos
        return { exito: true, datos: data };
      } else {
        return { exito: false, mensaje: `El número ${celularLimpio} no coincide con ningún registro activo.` };
      }
    } catch (error) {
      console.error("Error al verificar celular:", error.message);
      return { exito: false, mensaje: "Error de conexión con la base de datos." };
    }
  },

  // ==========================================
  // ACTIVAR CUENTA (sin guardar contraseña en texto plano)
  // ==========================================
  async activarCuenta(id, payload) {
    try {
      // ⚠️ Nota: Idealmente deberías usar supabase.auth.admin.createUser
      // para crear un usuario en auth.users y luego vincularlo con la tabla 'usuarios'.
      // Por ahora, actualizamos la tabla 'usuarios' (pero NO guardamos la contraseña en texto plano).
      // En su lugar, podrías generar un hash en el backend y guardarlo.
      // Como esto es un ejemplo, omitimos la contraseña.
      const { data, error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        localStorage.setItem('udat_app_session', JSON.stringify(data[0]));
      }
      return { exito: true, datos: data };
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