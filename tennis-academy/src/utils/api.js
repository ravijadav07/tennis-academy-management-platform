const WORKFLOW_ACTIONS = new Set([
  'student.enroll',
  'course.complete',
  'payment.capture',
  'reconciliation.upload',
  'report.generate',
  'payroll.compute',
  'leave.apply',
  'attendance.mark',
  'certificate.download',
  'absence.alert',
  'payment.reminder',
  'report.send',
]);

export async function triggerWorkflow(action, payload) {
  if (!WORKFLOW_ACTIONS.has(action)) {
    console.warn(`[api] Unknown workflow action: ${action}`);
    return { success: false, error: `Unknown action: ${action}` };
  }

  const proxy = import.meta.env.VITE_PUCHO_PROXY_URL;
  if (!proxy) {
    await new Promise(r => setTimeout(r, 1000));
    console.info(`[api] Mock mode -- no VITE_PUCHO_PROXY_URL set. Action: ${action}`);
    return { success: true, mock: true, message: `Mock response for ${action} -- connect the proxy for production` };
  }

  try {
    const res = await fetch(proxy, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    console.error(`[api] triggerWorkflow failed for ${action}:`, err);
    throw err;
  }
}