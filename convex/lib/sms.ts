// No SMS provider is chosen yet. Until one is, codes are written to the Convex logs
// (Dashboard → Logs) so the reset flow can be tested.
export async function sendSms(phone: string, message: string) {
  console.warn(`[sms:not-configured] to ${phone}: ${message}`);
}
