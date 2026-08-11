// aiService.js
import { supabaseAnonKey, supabaseUrl } from './supabaseClient';

export async function solicitarAnalisisDeRiesgo(idEvaluacion, comentarioTexto) {
  const functionUrl = `${supabaseUrl}/functions/v1/analizar-riesgo`;

  try {
    const respuesta = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        id_evaluacion: idEvaluacion,
        comentario: comentarioTexto
      })
    });

    if (!respuesta.ok) {
      const errorText = await respuesta.text();
      throw new Error(`Error ${respuesta.status}: ${errorText}`);
    }

    const data = await respuesta.json();
    return data.analisis || null; // BAJO, MEDIO o ALTO
  } catch (error) {
    console.error("Error en IA:", error.message);
    return null;
  }
}