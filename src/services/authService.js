import { supabase } from './supabaseClient';

export const authService = {
  // LOGIN ADMIN CON CORREO
  async loginAdmin(email, password) {
    try {
      // 1. Intentar iniciar sesión en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Verificar que el usuario tenga el rol 'Admin' en la tabla 'usuarios'
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .eq('rol', 'Admin')
        .maybeSingle();

      if (perfilError) throw perfilError;
      
      if (!perfil) {
        // Si no es admin, cerramos la sesión por seguridad
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de administrador.');
      }

      // 3. Guardar la sesión localmente
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
  }
};