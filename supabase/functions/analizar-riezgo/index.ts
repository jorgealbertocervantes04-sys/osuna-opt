// supabase/functions/analizar-riesgo/index.ts
// Use a newer std version to ensure the module is available and types resolve
// Use a std version known to be widely available for type resolution
// Use a recent std version that provides the http server for Deno
// Use a std version that resolves in typical environments; pin to a widely-available release
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// Use a Deno-compatible CDN build for Supabase client
// Use a concrete, published version compatible with Deno to avoid resolution errors
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.34.0?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const denoEnv = (globalThis as any).Deno?.env;
const OPENAI_API_KEY = denoEnv?.get("OPENAI_API_KEY") ?? "";
const SUPABASE_URL = denoEnv?.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = denoEnv?.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req: Request) => {
  // Manejo de pre-flight request para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { id_evaluacion, comentario } = await req.json();

  // 1. Llamada a la API de OpenAI
  const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
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
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
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