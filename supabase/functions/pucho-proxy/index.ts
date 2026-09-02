import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true",
};

const ALLOWED_ACTIONS = new Map([
  ["student.enroll", "PUCHO_WF_D_URL"],
  ["course.complete", "PUCHO_WF_E_URL"],
  ["payment.capture", "PUCHO_WF_I_URL"],
  ["reconciliation.upload", "PUCHO_WF_J_URL"],
  ["report.generate", "PUCHO_WF_K_URL"],
  ["payroll.compute", "PUCHO_WF_L_URL"],
  ["certificate.download", "PUCHO_CERTIFICATE_API_URL"],
]);

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(key);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function sanitizeForLog(obj: unknown): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > 500 ? s.slice(0, 500) + "..." : s;
  } catch {
    return "[unserializable]";
  }
}

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

  const clientIp = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(clientIp, 60, 60_000)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  let body: { action?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { action, payload } = body;
  if (!action || typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
    console.warn(`[PUCHO-PROXY] Rejected action=${sanitizeForLog(action)} ip=${clientIp}`);
    return new Response(JSON.stringify({ error: "Invalid or unsupported action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const envKey = ALLOWED_ACTIONS.get(action)!;
  const webhookUrl = Deno.env.get(envKey);
  if (!webhookUrl) {
    console.error(`[PUCHO-PROXY] Missing env var ${envKey} for action ${action}`);
    return new Response(JSON.stringify({ error: "Configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookAuthHeader = Deno.env.get("PUCHO_WEBHOOK_AUTH");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (webhookAuthHeader) {
    headers["Authorization"] = webhookAuthHeader;
  }

  try {
    const puchoRes = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload ?? {}),
    });

    const responseBody = await puchoRes.text();
    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(responseBody);
    } catch {
      jsonBody = { raw: responseBody };
    }

    console.log(
      `[PUCHO-PROXY] action=${action} status=${puchoRes.status} ip=${clientIp} payload=${sanitizeForLog(payload)}`
    );

    return new Response(JSON.stringify({
      success: puchoRes.ok,
      status: puchoRes.status,
      data: jsonBody,
    }), {
      status: puchoRes.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[PUCHO-PROXY] Fetch error action=${action}: ${err}`);
    return new Response(JSON.stringify({ error: "Workflow service unavailable" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});