const ACTION_WEBHOOK_MAP = {
  'absence.alert':     import.meta.env.VITE_PUCHO_WF_ABSENCE_ALERT,
  'payment.reminder':  import.meta.env.VITE_PUCHO_WF_PAYMENT_REMINDER,
  'report.send':       import.meta.env.VITE_PUCHO_WF_SLOT_REPORT,
};

const ACTION_NAMES = new Set(Object.keys(ACTION_WEBHOOK_MAP));

export async function triggerWorkflow(action, payload) {
  const webhookUrl = ACTION_WEBHOOK_MAP[action];
  if (!webhookUrl) {
    console.warn(`[api] No webhook URL configured for action: ${action}`);
    return { success: false, mock: true, message: `No webhook configured for ${action}` };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    console.error(`[api] triggerWorkflow failed for ${action}:`, err);
    throw err;
  }
}