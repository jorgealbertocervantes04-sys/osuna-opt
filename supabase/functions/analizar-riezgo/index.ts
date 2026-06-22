// supabase/functions/analizar-riesgo/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de pre-flight request para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { id_evaluacion, comentario } = await req.json();

  // 1. Llamada a la API de OpenAI
  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un auditor de seguridad para una empresa de transporte. Analiza el comentario de un tutor de manejo sobre un alumno. Clasifica el riesgo en: BAJO, MEDIO o ALTO basándote en comportamientos peligrosos reportados. Responde ÚNICAMENTE con la palabra: BAJO, MEDIO o ALTO."
        },
        { role: "user", content: comentario }
      ],
      temperature: 0.3,
    }),
  });

  const aiData = await openaiResponse.json();
  const analisis = aiData.choices[0].message.content.trim();

  // 2. Actualizar la base de datos con el resultado de la IA
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { error } = await supabase
    .from("evaluaciones_cardex")
    .update({ analisis_ia: analisis })
    .eq("id", id_evaluacion);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ analisis }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});