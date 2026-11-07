// What the "+ Log contact" form shows after the server answers.
// A saved note stays visible after the form closes. A failure keeps the form open.

export function logContactFeedback(result: { ok: true } | { ok: false; error: string }): {
  formOpen: boolean
  status: string
  failed: boolean
} {
  if (!result.ok) return { formOpen: true, status: result.error, failed: true }
  return { formOpen: false, status: 'Saved. The note is on that client’s record.', failed: false }
}
