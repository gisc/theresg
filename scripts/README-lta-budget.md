# ThereSG DataMall budget operations

All outbound DataMall-key requests reserve one of 50,000 tokens in Olares-managed PostgreSQL before network use. The reservation is atomic among app replicas. Failed upstream attempts consume a token because the remote request may have been charged; cache hits do not. The counter uses the database's Asia/Singapore calendar day, switching at midnight SGT without a scheduled reset. The PostgreSQL middleware must provision `theresgquota` and `lta_daily_budget` before first use; if it cannot, live LTA endpoints fail closed with HTTP 503.

## Check privately

On the user's Olares, use Control Hub > PostgreSQL > terminal, connect to the app database `theresgquota`, and run `scripts/lta-budget-status.sql`. Olares documentation for private terminal access: https://www.olares.com/docs/developer/develop/mw-view-pg-data . The app's console log emits single warnings at 35,000 and 45,000 reservations per SGT day. The public app must not expose the counter, key, or database credentials. This is a private operator query, not an internet endpoint.

## Release checks

Verify the middleware DB/schema exists; a normal live endpoint works; a private counter read rises after a cold single request (warm cache hit should not increase it); Stop/Resume retains count; and a synthetic local test with a tiny cap checks concurrency and denial. Do not load-test production or reset today's counter. If PostgreSQL goes down, all LTA-backed endpoints become unavailable by design; static maps and content can still load. If the DB is restored to a stale backup after node loss, the count can roll backward and the approved daily ceiling is no longer assured; stop protected calls and reconcile from external usage evidence before reopening. Treat a failed or unverified persistence check as a launch blocker.
