// 301 redirect from retired Olares hostnames to the canonical ThereSG origin.
// Host-gated so the ThereSG install (same image) is unaffected.
// TEMPORARY (8 Nov 2026): theresg.huatbigbig888.olares.com is deliberately NOT
// redirected while www.there.sg is unreachable (Olares custom-domain route
// pending), so the default Olares address serves the app directly. Re-add it
// to this check when www.there.sg is healthy again.
export default defineEventHandler((event) => {
  const host = getRequestHost(event)
  if (host === 'transitsg.huatbigbig888.olares.com') {
    return sendRedirect(event, 'https://www.there.sg' + event.path, 301)
  }
})
