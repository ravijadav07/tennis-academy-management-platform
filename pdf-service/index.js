import express from "express";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) {
  console.error("[pdf-service] Missing API_KEY env var");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[pdf-service] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const app = express();
app.use(express.json());

function authMiddleware(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function validateCertificateInput(body) {
  const required = [
    "student_id",
    "package_id",
    "student_name",
    "course_name",
    "completion_date",
    "coach_name",
    "entity",
  ];
  const missing = required.filter((f) => !body[f] || typeof body[f] !== "string" || body[f].trim() === "");
  if (missing.length > 0) {
    return { valid: false, missing };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(body.student_id)) {
    return { valid: false, error: "student_id is not a valid UUID" };
  }
  if (!uuidRegex.test(body.package_id)) {
    return { valid: false, error: "package_id is not a valid UUID" };
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(body.completion_date)) {
    return { valid: false, error: "completion_date must be YYYY-MM-DD" };
  }

  return { valid: true };
}

async function renderPdf(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    return pdf;
  } finally {
    await browser.close();
  }
}

function generateCertificateId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `AJTA-${result}`;
}

function formatEntity(entity) {
  switch (entity) {
    case "the-club":
      return "The Club";
    case "tots-tennis":
      return "TOTS Tennis";
    default:
      return entity;
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

app.post("/api/generate-certificate", authMiddleware, async (req, res) => {
  try {
    const validation = validateCertificateInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: "Validation failed", details: validation });
    }

    const { student_id, package_id, student_name, course_name, completion_date, coach_name, entity } = req.body;

    const certificateId = generateCertificateId();
    const entityDisplay = formatEntity(entity);
    const formattedDate = formatDate(completion_date);

    const templatePath = resolve(__dirname, "templates", "certificate.html");
    if (!existsSync(templatePath)) {
      return res.status(500).json({ error: "Certificate template not found" });
    }

    let html = readFileSync(templatePath, "utf-8");
    html = html
      .replace(/{{student_name}}/g, student_name)
      .replace(/{{course_name}}/g, course_name)
      .replace(/{{completion_date}}/g, formattedDate)
      .replace(/{{coach_name}}/g, coach_name)
      .replace(/{{certificate_id}}/g, certificateId)
      .replace(/{{entity_display}}/g, entityDisplay);

    console.log(`[pdf-service] Generating certificate ${certificateId} for student ${student_id}`);

    const pdfBuffer = await renderPdf(html);

    const storagePath = `${student_id}/${certificateId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error(`[pdf-service] Storage upload failed: ${uploadError.message}`);
      return res.status(500).json({ error: "Failed to upload certificate to storage", details: uploadError.message });
    }

    const { error: insertError } = await supabase.from("certificates").insert({
      student_id,
      package_id,
      file_path: storagePath,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        console.log(`[pdf-service] Certificate already exists for student=${student_id} package=${package_id}`);
      } else {
        console.error(`[pdf-service] Failed to save certificate record: ${insertError.message}`);
        return res.status(500).json({ error: "Failed to save certificate record", details: insertError.message });
      }
    }

    console.log(`[pdf-service] Certificate ${certificateId} generated successfully`);

    res.json({
      success: true,
      certificate_id: certificateId,
      file_path: storagePath,
    });
  } catch (err) {
    console.error(`[pdf-service] Unexpected error: ${err.message}`);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[pdf-service] Running on port ${PORT}`);
});