/**
 * Generates a reasonably-collision-safe local ID.
 *
 * IDs were previously built ad hoc as `` `prefix-${Date.now()}` `` in about
 * half of the ~30 places across the app that create one, while the other
 * half already appended a random suffix (`` `vp-${Date.now()}-${Math.random()...}` ``)
 * -- an inconsistent, partially-fixed pattern. Two items of the same kind
 * created within the same millisecond (a fast double-submit, a bulk import)
 * would collide and silently overwrite each other wherever the random
 * suffix was missing. This makes every call site collision-safe the same
 * way.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
