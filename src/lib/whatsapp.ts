/**
 * WhatsApp API Client
 * Send messages via CtrlMaster WhatsApp API
 */

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:3001';
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || '';

interface WhatsAppMessage {
  phone: string;
  message: string;
}

interface WhatsAppBulkMessage {
  messages: WhatsAppMessage[];
}

interface WhatsAppResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Send a single WhatsApp message
 */
export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<WhatsAppResponse> {
  if (!WHATSAPP_API_KEY) {
    console.warn('⚠️ WhatsApp API key not configured');
    return { success: false, error: 'WhatsApp API no configurada' };
  }

  try {
    const res = await fetch(`${WHATSAPP_API_URL}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WHATSAPP_API_KEY,
      },
      body: JSON.stringify({ phone, message }),
    });

    return res.json();
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    return { success: false, error: 'Error de conexión con WhatsApp API' };
  }
}

/**
 * Send bulk WhatsApp messages
 */
export async function sendWhatsAppBulk(
  messages: WhatsAppMessage[]
): Promise<WhatsAppResponse> {
  if (!WHATSAPP_API_KEY) {
    return { success: false, error: 'WhatsApp API no configurada' };
  }

  try {
    const res = await fetch(`${WHATSAPP_API_URL}/api/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': WHATSAPP_API_KEY,
      },
      body: JSON.stringify({ messages } as WhatsAppBulkMessage),
    });

    return res.json();
  } catch (error) {
    console.error('Error sending WhatsApp bulk:', error);
    return { success: false, error: 'Error de conexión con WhatsApp API' };
  }
}

/**
 * Check WhatsApp API health
 */
export async function checkWhatsAppHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${WHATSAPP_API_URL}/api/health`);
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
