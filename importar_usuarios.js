import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

// 1. Configuración (Usa variables de entorno si puedes, pero para local esto basta)
const supabaseUrl = 'TU_URL_AQUI'; // La encuentras en Project Settings > API
const supabaseServiceRoleKey = 'TU_SERVICE_ROLE_KEY_AQUI'; // ¡NO COMPARTAS ESTA LLAVE!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function importarUsuarios() {
  const stream = fs.createReadStream('usuarios.csv');
  
  stream.pipe(csv())
    .on('data', async (row) => {
      // Detenemos el flujo para procesar uno a uno (evita saturar Supabase)
      stream.pause();
      
      const email = `${row.id_usuario}@trayecto.com`; // Dominio ficticio para el auth
      
      console.log(`Procesando: ${row.nombre} (${email})...`);

      const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: 'PasswordTemporal123!',
        email_confirm: true,
        user_metadata: { 
          nombre: row.nombre,
          id_usuario: row.id_usuario 
        }
      });

      if (error) {
        console.error(`Error con ${row.id_usuario}:`, error.message);
      } else {
        console.log(`✅ Creado: ${row.nombre}`);
      }

      stream.resume();
    })
    .on('end', () => console.log('Proceso finalizado.'));
}

importarUsuarios();