import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';

// 1. Configuración (Usa variables de entorno si puedes, pero para local esto basta)
const supabaseUrl = 'https://qykubittvlwsavrhljek.supabase.co'; // La encuentras en Project Settings > API
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5a3ViaXR0dmx3c2F2cmhsamVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTY1ODUsImV4cCI6MjA5NjU5MjU4NX0.5vcZXG7qTAqVO87EChPbQVIDeVvmNuBCrjIUddySMzk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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