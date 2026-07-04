export async function solicitarAnalisisDeRiesgo(idEvaluacion, comentarioTexto) {
  // Asegúrate de poner la URL de tu proyecto
  const functionUrl = 'https://qykubittvlwsavrh1jek.supabase.co/functions/v1/analizar-riesgo';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5a3ViaXR0dmx3c2F2cmhsamVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTY1ODUsImV4cCI6MjA5NjU5MjU4NX0.5vcZXG7qTAqVO87EChPbQVIDeVvmNuBCrjIUddySMzk'; 

  try {
    const respuesta = await fetch(functionUrl, {
      method: 'POST', // Esto soluciona el Error 500
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
      throw new Error(`Error del servidor: ${errorText}`);
    }

    const data = await respuesta.json();
    return data.analisis; // Devolverá BAJO, MEDIO o ALTO

  } catch (error) {
    console.error("Hubo un problema al ejecutar la IA:", error);
    return null;
  }
}