-- RPC: cumulative user count at end of each day in [start_date, end_date]
CREATE OR REPLACE FUNCTION public.get_cumulative_users_by_day(p_start_date date, p_end_date date)
RETURNS TABLE (day date, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH signups_per_day AS (
    SELECT date(created_at) AS d, count(*)::bigint AS c
    FROM "Users"
    GROUP BY date(created_at)
  ),
  days AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS day
  )
  SELECT
    days.day,
    (SELECT coalesce(sum(s.c), 0)::bigint FROM signups_per_day s WHERE s.d <= days.day) AS count
  FROM days
  ORDER BY days.day;
$$;
