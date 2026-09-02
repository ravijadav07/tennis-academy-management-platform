import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { student_id?: string; package_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { student_id, package_id } = body;
  if (!student_id || !package_id) {
    return new Response(JSON.stringify({ error: "Missing student_id or package_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("[certificate-api] Missing Supabase env vars");
    return new Response(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: cert, error: certError } = await supabase
    .from("certificates")
    .select("file_path")
    .eq("student_id", student_id)
    .eq("package_id", package_id)
    .maybeSingle();

  if (certError) {
    console.error(`[certificate-api] DB query error: ${certError.message}`);
    return new Response(JSON.stringify({ error: "Failed to look up certificate" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!cert) {
    return new Response(JSON.stringify({ error: "Certificate not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from("certificates")
    .createSignedUrl(cert.file_path, 3600);

  if (signedError || !signedData?.signedUrl) {
    console.error(`[certificate-api] Signed URL error: ${signedError?.message ?? "unknown"}`);
    return new Response(JSON.stringify({ error: "Failed to generate download link" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log(`[certificate-api] Signed URL generated for student=${student_id} package=${package_id}`);

  return new Response(JSON.stringify({
    success: true,
    signed_url: signedData.signedUrl,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});