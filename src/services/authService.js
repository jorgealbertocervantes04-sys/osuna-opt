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

  // 3. Validar credenciales (Login Admin)
  async loginAdmin(nombreUsuario, password) {
    try {
      // Modificamos la búsqueda para localizar la columna correcta
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('nombre_completo', nombreUsuario)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        throw new Error('Usuario no encontrado en la base de datos.');
      }

      if (data.contrasena !== password) {
        throw new Error('Contraseña incorrecta.');
      }

      // Validamos los permisos precisos
      if (data.rol !== 'Administración' && data.rol !== 'Admin') {
        throw new Error('No tienes privilegios de administrador.');
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