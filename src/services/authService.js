import { supabase } from './supabaseClient';

export const authService = {
  // ==========================================
  // 1. LOGIN DE ADMINISTRADORES
  // ==========================================
  async loginAdmin(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .eq('rol', 'Admin')
        .maybeSingle();

      if (perfilError) throw perfilError;
      
      if (!perfil) {
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de administrador.');
      }

      localStorage.setItem('udat_admin_session', JSON.stringify(perfil));
      return { exito: true, datos: perfil };

    } catch (error) {
      console.error("Error en loginAdmin:", error.message);
      return { exito: false, mensaje: error.message };
    }
  },

  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('udat_admin_session');
  },

  // ==========================================
  // 2. APP MÓVIL: VERIFICAR CELULAR OPERADOR
  // ==========================================
  async verificarCelular(numeroCelular) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('celular', numeroCelular)
        .maybeSingle(); 

      if (error) throw error;

      if (data) {
        return { exito: true, datos: data };
      } else {
        return { exito: false, mensaje: "Este número no está registrado en el sistema." };
      }
    } catch (error) {
      console.error("Error al verificar celular:", error.message);
      return { exito: false, mensaje: "Error de conexión con la base de datos." };
    }
  },

  // ==========================================
  // 3. APP MÓVIL: ACTIVAR CUENTA (REGISTRO)
  // ==========================================
  async activarCuenta(id, payload) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) throw error;
      
      return { exito: true, datos: data };
    } catch (error) {
      console.error("Error en activarCuenta:", error.message);
      return { exito: false, mensaje: "No se pudo registrar la información." };
    }
  }
};