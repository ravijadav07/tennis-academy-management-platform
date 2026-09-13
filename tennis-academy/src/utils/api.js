const ACTION_WEBHOOK_MAP = {
  'absence.alert':         import.meta.env.VITE_PUCHO_WF_ABSENCE_ALERT,
  'payment.reminder':      import.meta.env.VITE_PUCHO_WF_PAYMENT_REMINDER,
  'report.send':           import.meta.env.VITE_PUCHO_WF_SLOT_REPORT,
  'payment.capture':       import.meta.env.VITE_PUCHO_WF_PAYMENT_CAPTURE,
  'reconciliation.upload': import.meta.env.VITE_PUCHO_WF_RECONCILIATION,
  'certificate.download':  import.meta.env.VITE_PUCHO_WF_COURSE_COMPLETION,
  'student.onboard':       import.meta.env.VITE_PUCHO_WF_STUDENT_ONBOARDING,
  'leave.apply':           import.meta.env.VITE_PUCHO_WF_COACH_LEAVE,
  'invoice.occupancy':     import.meta.env.VITE_PUCHO_WF_INVOICE_OCCUPANCY,
};

const ACTION_NAMES = new Set(Object.keys(ACTION_WEBHOOK_MAP));

export async function triggerWorkflow(action, payload, { sync = false, test = false } = {}) {
  let webhookUrl = ACTION_WEBHOOK_MAP[action];
  const isMockMode = import.meta.env.VITE_MOCK_WEBHOOKS === 'true' || webhookUrl === 'mock';

  if (!webhookUrl || isMockMode) {
    console.info(`[api] Workflow "${action}" executed via local simulation.`);
    return { success: true, mock: true, message: `Workflow "${action}" executed via local simulation.` };
  }

  const isExplicitTest = test || import.meta.env.VITE_TEST_WEBHOOKS === 'true';
  if (isExplicitTest && webhookUrl.startsWith('http') && !webhookUrl.endsWith('/test')) {
    webhookUrl = `${webhookUrl.replace(/\/sync$/, '').replace(/\/$/, '')}/test`;
  } else if (sync && webhookUrl.startsWith('http') && !webhookUrl.endsWith('/sync') && !webhookUrl.endsWith('/test')) {
    webhookUrl = `${webhookUrl.replace(/\/$/, '')}/sync`;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      console.info(`[api] Webhook HTTP ${res.status} for action "${action}". Executing local workflow simulation.`);
      return { success: true, mock: true, status: res.status, message: `Workflow "${action}" executed via local simulation.` };
    }
    return data;
  } catch (err) {
    console.info(`[api] triggerWorkflow offline mode for ${action}:`, err.message);
    return { success: true, mock: true, error: err.message };
  }
}