import pg from 'pg';

export const DAILY_LIMIT = 50_000;

// One atomic statement across all app replicas. A denied reservation sends no LTA request.
export const RESERVE_SQL = `INSERT INTO lta_daily_budget(day, calls)
  VALUES ((now() AT TIME ZONE 'Asia/Singapore')::date, 1)
  ON CONFLICT (day) DO UPDATE SET calls = lta_daily_budget.calls + 1
    WHERE lta_daily_budget.calls < $1
  RETURNING day::text, calls`;

let pool: pg.Pool | undefined;
function getPool() {
  if (!pool) {
    const { LTA_BUDGET_DB_HOST: host, LTA_BUDGET_DB_PORT: port, LTA_BUDGET_DB_NAME: database,
      LTA_BUDGET_DB_USER: user, LTA_BUDGET_DB_PASSWORD: password } = process.env;
    if (!host || !port || !database || !user || !password) throw new Error('LTA budget database is not configured');
    pool = new pg.Pool({ host, port: Number(port), database, user, password,
      max: 4, connectionTimeoutMillis: 1500, idleTimeoutMillis: 30000, query_timeout: 5000,
      application_name: 'theresg-lta-budget' });
  }
  return pool;
}

export async function reserveLtaCall() {
  const client = await getPool().connect();
  try {
    // Do not permit a database configured for asynchronous commits to acknowledge
    // a token which may be lost on an ordinary database crash.
    await client.query('BEGIN');
    await client.query('SET LOCAL synchronous_commit = on');
    const result = await client.query<{ day: string; calls: number }>(RESERVE_SQL, [DAILY_LIMIT]);
    await client.query('COMMIT');
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
