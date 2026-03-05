interface SupabaseCompatError {
  message?: string;
  details?: string;
  hint?: string;
}

function isMissingColumnError(error: SupabaseCompatError | null, columnName: string): boolean {
  const text = `${error?.message ?? ''} ${error?.details ?? ''} ${error?.hint ?? ''}`.toLowerCase();
  return text.includes(columnName) && (text.includes('column') || text.includes('schema cache'));
}

/**
 * Detects when a Supabase query fails because the `google_id` column
 * hasn't been migrated yet. Used as a graceful-degradation guard
 * so live-questions routes can fall back to email-only queries.
 */
export function isMissingGoogleIdColumn(error: SupabaseCompatError | null): boolean {
  return isMissingColumnError(error, 'google_id');
}

/**
 * Detects when a Supabase query/update fails because the `resolution`
 * column is missing on `UserFeedback` in older schemas.
 */
export function isMissingFeedbackResolutionColumn(error: SupabaseCompatError | null): boolean {
  return isMissingColumnError(error, 'resolution');
}
