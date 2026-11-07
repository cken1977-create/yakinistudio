// Hide people removed from the roster when the column exists, and keep
// working on a database that does not have the removal migration yet.

export async function withRoster<T extends { error: { message: string } | null }>(
  run: (hideRemoved: boolean) => PromiseLike<T>,
): Promise<T> {
  const first = await run(true)
  if (first.error && /deleted_at/i.test(first.error.message)) return run(false)
  return first
}
