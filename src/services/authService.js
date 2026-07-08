import { supabase } from './supabaseClient';

export const authService = {
  // ==========================================
  // 1. LOGIN DE ADMINISTRADORES Y DIRECTIVOS
  // ==========================================
  async loginAdmin(email, password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // Buscar si el usuario es Admin o General
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .in('rol', ['Admin', 'General']) // Permite entrar si es Admin o Alta Dirección
        .maybeSingle();

      if (perfilError) throw perfilError;
      
      if (!perfil) {
        await supabase.auth.signOut();
        throw new Error('No tienes permisos de administrador o directivo.');
      }

      // Se guarda la sesión con la llave unificada global
      localStorage.setItem('udat_app_session', JSON.stringify(perfil));
      return { exito: true, datos: perfil };

    } catch (error) {
      console.error("Error en loginAdmin:", error.message);
      return { exito: false, mensaje: error.message };
    }
  },

  async logout() {
    await supabase.auth.signOut();
    // Limpieza de la llave unificada global
    localStorage.removeItem('udat_app_session');
  },

  // ==========================================
  // 2. APP MÓVIL: VERIFICAR CELULAR OPERADOR (Corregido)
  // ==========================================
  async verificarCelular(numeroCelular) {
    try {
      // Limpiamos espacios en blanco que el usuario pueda escribir por error
      const celularLimpio = String(numeroCelular).trim();

      // Buscamos coincidencia exacta
      let { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('celular', celularLimpio)
        .maybeSingle(); 

      if (error) throw error;

      // SI NO LO ENCUENTRA CON 10 DÍGITOS:
      // Hacemos un segundo intento buscando si en Supabase incluye el código de país (52)
      if (!data) {
        const intentoConPrefijo = `52${celularLimpio}`;
        const { data: dataPrefijo, error: errorPrefijo } = await supabase
          .from('usuarios')
          .select('*')
          .eq('celular', intentoConPrefijo)
          .maybeSingle();
          
        if (errorPrefijo) throw errorPrefijo;
        data = dataPrefijo; // Si lo encuentra con 52, usamos ese usuario
      }

      if (data) {
        // Se guarda la sesión del operador con la llave unificada
        localStorage.setItem('udat_app_session', JSON.stringify(data));
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
      
      // Actualizamos la sesión en caché si se activa la cuenta
      if (data && data.length > 0) {
         localStorage.setItem('udat_app_session', JSON.stringify(data[0]));
      }

      return { exito: true, datos: data };
    } catch (error) {
      console.error("Error en activarCuenta:", error.message);
      return { exito: false, mensaje: "No se pudo registrar la información." };
    }
  },// ==========================================
  // 8. OBTENER EVALUACIONES (Faltaba en la actualización)
  // ==========================================
  async obtenerEvaluaciones() {
    try {
      const { data, error } = await supabase.from('encuestas').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error obteniendo evaluaciones:", error.message);
      return [];
    }
  }
};