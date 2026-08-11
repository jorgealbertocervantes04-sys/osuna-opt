// supabase/functions/analizar-riesgo/index.ts
// @ts-ignore: Deno remote import - ignore TS module resolution in local editor
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore: allow remote import of supabase client in Deno environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: { method: string; json: () => PromiseLike<{ id_evaluacion: any; comentario: any; }> | { id_evaluacion: any; comentario: any; }; }) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { id_evaluacion, comentario } = await req.json();

    if (!id_evaluacion || !comentario) {
      return new Response(
        JSON.stringify({ error: "Faltan id_evaluacion o comentario" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Llamada a OpenAI
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

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI error: ${openaiResponse.status} - ${errorText}`);
    }

    const aiData = await openaiResponse.json();
    const analisis = aiData.choices?.[0]?.message?.content?.trim() || "MEDIO";

    // 2. Actualizar la tabla evaluaciones_cardex
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error } = await supabase
      .from("evaluaciones_cardex")
      .update({ analisis_ia: analisis })
      .eq("id", id_evaluacion);

    if (error) {
      console.error("Error al actualizar la BD:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ analisis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error general:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
