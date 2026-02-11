/**
 * Detects when a Supabase query fails because the `google_id` column
 * hasn't been migrated yet.  Used as a graceful-degradation guard
 * so live-questions routes can fall back to email-only queries.
 */
export function isMissingGoogleIdColumn(error: { message?: string } | null): boolean {
    const message = error?.message?.toLowerCase() ?? '';
    return message.includes('google_id') && (message.includes('column') || message.includes('schema cache'));
}
