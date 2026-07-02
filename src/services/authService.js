import { supabase } from './supabaseClient';

export const authService = {
  // 1. Verificar celular (Para Alumnos y Tutores)
  async verificarCelular(telefono) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('telefono', telefono)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Número celular no autorizado en UDAT.');
      
      return { exito: true, datos: data };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  },

  // 2. Activar cuenta nueva (Actualiza los datos del usuario)
  async activarCuenta(id, datosActualizados) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update(datosActualizados)
        .eq('id', id);

      if (error) throw error;
      return { exito: true };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  },

  // 3. Validar contraseña maestra (Login Admin)
  async loginAdmin(correo, password) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correo)
        .eq('rol', 'Admin')
        .maybeSingle();

      if (error) throw error;
      if (!data || data.contrasena !== password) {
        throw new Error('Credenciales incorrectas o sin privilegios de administrador.');
      }

      return { exito: true, datos: data };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  },

  // 4. Cambiar contraseña
  async cambiarPassword(id, nuevaPass) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ contrasena: nuevaPass })
        .eq('id', id);

      if (error) throw error;
      return { exito: true };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  }
};
async function handleLogin() {
  const user = await authService.login(credentials);
  if (user.authenticated) {
    // 1. Guardar token
    localStorage.setItem('token', user.token);
    // 2. Redirigir
    router.push('/dashboard');
  } else {
    // Manejar error
  }
}