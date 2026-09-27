// 301 redirect from the retired TransitSG host to there.sg.
// Host-gated so the ThereSG install (same image) is unaffected.
export default defineEventHandler((event) => {
  const host = getRequestHost(event)
  if (host === 'transitsg.huatbigbig888.olares.com') {
    return sendRedirect(event, 'https://www.there.sg' + event.path, 301)
  }
})
