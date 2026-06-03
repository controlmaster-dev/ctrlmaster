import dns from "node:dns";
import nodemailer from "nodemailer";

/** Evita fallos intermitentes cuando IPv6 no enruta pero el DNS devuelve AAAA primero. */
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

export type EmailAttachment = {
  filename: string;
  content: Buffer;
};

export type TransactionalEmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
};

export type TransactionalEmailResult = {
  success: boolean;
  messageId?: string;
  provider?: "resend" | "smtp";
  error?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 25_000;
const RESEND_RETRY_ATTEMPTS = 5;
const RESEND_RETRY_BASE_MS = 600;

const NETWORK_ERROR_MSG =
  "No se pudo enviar el correo: problemas de red o DNS con Resend. Espera unos segundos e intenta de nuevo.";

function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key === "re_xxx" || key.startsWith("tu_")) return null;
  return key;
}

export function hasSmtpCredentials(): boolean {
  const user = process.env.SMTP_EMAIL?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  return Boolean(user && pass);
}

function getResendFrom(): string {
  return (
    process.env.RESEND_FROM?.trim() || "Control Master <alertas@enlacecr.dev>"
  );
}

export function isEmailNetworkError(message: string): boolean {
  return /could not be resolved|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|ECONNRESET|EAI_AGAIN|fetch failed|Unable to fetch|network|aborted|problemas de red|DNS inestable|DNS con Resend/i.test(
    message
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function networkErrorResult(): TransactionalEmailResult {
  const hint = hasSmtpCredentials()
    ? NETWORK_ERROR_MSG
    : `${NETWORK_ERROR_MSG} También puedes configurar SMTP_EMAIL y SMTP_PASSWORD en .env como respaldo.`;
  return { success: false, error: hint };
}

type ResendApiBody = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
  attachments?: { filename: string; content: string }[];
};

async function sendViaResendHttpOnce(
  payload: TransactionalEmailPayload,
  apiKey: string
): Promise<TransactionalEmailResult> {
  const to = Array.isArray(payload.to) ? payload.to : [payload.to];
  const body: ResendApiBody = {
    from: getResendFrom(),
    to,
    subject: payload.subject,
    html: payload.html,
  };
  if (payload.text) body.text = payload.text;
  if (payload.replyTo) body.reply_to = payload.replyTo;
  if (payload.attachments?.length) {
    body.attachments = payload.attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
    }));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: string;
    };

    if (!res.ok) {
      const msg = data.message || data.error || `HTTP ${res.status}`;
      if (isEmailNetworkError(msg)) return networkErrorResult();
      return { success: false, error: `Resend: ${msg}` };
    }

    return {
      success: true,
      messageId: data.id,
      provider: "resend",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isEmailNetworkError(message)) return networkErrorResult();
    return { success: false, error: `Resend: ${message}` };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendViaResend(
  payload: TransactionalEmailPayload
): Promise<TransactionalEmailResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY no está configurada en .env" };
  }

  let lastError = NETWORK_ERROR_MSG;

  for (let attempt = 0; attempt < RESEND_RETRY_ATTEMPTS; attempt++) {
    const result = await sendViaResendHttpOnce(payload, apiKey);
    if (result.success) return result;

    lastError = result.error ?? lastError;
    if (!isEmailNetworkError(lastError) || attempt >= RESEND_RETRY_ATTEMPTS - 1) {
      return result;
    }

    await delay(RESEND_RETRY_BASE_MS * (attempt + 1));
  }

  return { success: false, error: lastError };
}

async function sendViaSmtp(
  payload: TransactionalEmailPayload
): Promise<TransactionalEmailResult> {
  if (!hasSmtpCredentials()) {
    return {
      success: false,
      error:
        "SMTP no configurado. Añade SMTP_EMAIL y SMTP_PASSWORD en .env, o corrige la conexión a Resend.",
    };
  }

  const user = process.env.SMTP_EMAIL!.trim();
  const pass = process.env.SMTP_PASSWORD!.trim();

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || "smtp.office365.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 25_000,
    });

    const to = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;
    const info = await transporter.sendMail({
      from: `"Control Master" <${user}>`,
      to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      attachments: payload.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    return {
      success: true,
      messageId: info.messageId,
      provider: "smtp",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const hint =
      message.includes("Missing credentials") || message.includes("EAUTH")
        ? "Credenciales SMTP inválidas o vacías en .env"
        : message;
    return { success: false, error: hint };
  }
}

/**
 * Envía correo: Resend (HTTP) con reintentos; si falla y hay SMTP, usa Office365.
 */
export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload
): Promise<TransactionalEmailResult> {
  const resendResult = await sendViaResend(payload);
  if (resendResult.success) return resendResult;

  const resendError = resendResult.error ?? "Error desconocido en Resend";
  console.warn("[email] Resend no disponible:", resendError);

  if (!hasSmtpCredentials()) {
    const hasKey = Boolean(getResendApiKey());
    return {
      success: false,
      error: hasKey
        ? resendError
        : "Configura RESEND_API_KEY en .env (reinicia el servidor después de guardar).",
    };
  }

  console.warn("[email] Intentando SMTP como respaldo…");
  const smtpResult = await sendViaSmtp(payload);
  if (smtpResult.success) return smtpResult;

  return {
    success: false,
    error: `${resendError}. Respaldo SMTP: ${smtpResult.error}`,
  };
}
