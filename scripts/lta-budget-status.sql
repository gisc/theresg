-- Owner-only use in the Olares Control Hub PostgreSQL terminal. Do not expose as an API.
-- Connect to the app's theresgquota database first. This query never prints key/password.
SELECT (now() AT TIME ZONE 'Asia/Singapore')::date AS sg_day,
       COALESCE((SELECT calls FROM lta_daily_budget
                 WHERE day = (now() AT TIME ZONE 'Asia/Singapore')::date), 0) AS reserved_calls,
       50000 AS daily_limit;
