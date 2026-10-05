<script setup lang="ts">
definePageMeta({ title: 'Events' });
useSeoMeta({ title: 'Events', description: 'Find library programmes, community events, park activities and performances through official Singapore calendars.' });
const sources = [
 { name: 'Libraries', icon: 'material-symbols:local-library-outline', description: 'Talks, workshops and learning programmes.', publisher: 'NLB GoLibrary', url: 'https://nlb.libcal.com/calendar/public' },
 { name: 'Neighbourhoods', icon: 'material-symbols:groups-outline', description: 'Community club and neighbourhood activities.', publisher: 'onePA', url: 'https://www.onepa.gov.sg/events/neighbourhood-events' },
 { name: 'Parks', icon: 'material-symbols:park-outline', description: 'Walks, workshops and events in green spaces.', publisher: 'NParks', url: 'https://www.nparks.gov.sg/visit/events' },
 { name: 'Garden concerts', icon: 'material-symbols:music-note-outline', description: 'Concert overview at Singapore Botanic Gardens.', publisher: 'Singapore Botanic Gardens', url: 'https://sbg.nparks.gov.sg/events/concerts/' },
 { name: 'Performances', icon: 'material-symbols:theater-comedy-outline', description: 'Music, theatre and outdoor performances.', publisher: 'Esplanade', url: 'https://www.esplanade.com/whats-on' },
];
</script>
<template>
<div class="bg"><main class="pg">
<h1>Events</h1>
<p class="intro">Find what's happening through official Singapore calendars.</p>
<section class="featured" aria-labelledby="featured-heading">
<h2 id="featured-heading">Featured events</h2>
<article class="event-card">
<img src="/img/haw-ror-villa-illustration.webp" alt="Illustration of a lantern-lit Chinese garden gateway with mist and playful ghost silhouettes" class="event-image" />
<div class="event-copy"><h3>Haw Ror Villa 5</h3><p class="event-meta">Haw Par Villa · 8 Oct–15 Nov 2026, select nights</p><p>Four scare zones, a puzzle hunt and a maze experience at Hell's Museum's Halloween event.</p><div class="event-footer"><a href="https://cnalifestyle.channelnewsasia.com/living/haw-ror-villa-5-halloween-589881" class="go" target="_blank" rel="noopener noreferrer">Read more ↗</a><NuxtLink to="/all?toId=a%3AHaw%20Par%20Villa" class="go">Commute</NuxtLink><NuxtLink to="/mrt?to=Haw%20Par%20Villa" class="go">By MRT</NuxtLink></div></div>
</article>
<article class="event-card" style="margin-top:16px">
<img src="/img/sgim-illustration.webp" alt="Concept illustration of runners on a Marina Bay waterfront road at sunrise with the National Stadium dome and city skyline behind" class="event-image" />
<div class="event-copy"><h3>2026 BYD Singapore International Marathon</h3><p class="event-meta">4-6 Dec 2026 · BYD Marathon Sun 6 Dec: start F1 Pit Building, finish National Stadium</p><p>Singapore's national marathon weekend, from the 42.195km BYD Marathon to the 10KM, 5KM and Kids Dash. BYD Marathon availability differs across the organiser's pages, so check current registration. The events page says 10KM, 5KM and Kids Dash registration runs to 31 Oct 2026, or until full, while the homepage still says registration closes 30 Sep. Free early MRT runs on race morning from 2:30am.</p><p class="event-meta">Concept illustration, not the race route.</p><div class="event-footer"><a href="https://singaporeinternationalmarathon.com/" class="go" target="_blank" rel="noopener noreferrer">Read more ↗</a><NuxtLink to="/mrt?to=Stadium" class="go">By MRT</NuxtLink></div></div>
</article></section>
<h2 class="directories-heading">Event directories</h2>
<div class="sources"><article v-for="source in sources" :key="source.url" class="source">
<Icon :name="source.icon" class="source-icon" />
<div class="copy"><h2>{{source.name}}</h2><p>{{source.description}}</p><small>{{source.publisher}}</small></div>
<a :href="source.url" class="go" target="_blank" rel="noopener noreferrer" :aria-label="`Browse ${source.name.toLowerCase()} on ${source.publisher} (opens in a new tab)`">Browse ↗</a>
</article></div>
<p class="note">Opens the official site. Check dates, venue, fees and registration there. These are source links, not a combined live event feed.</p>
<NuxtLink to="/places" class="places-link">Find a place &amp; how to get there →</NuxtLink>
<DataCredits />
</main></div>
</template>
<style scoped>
.bg{height:100%;width:100%;background:var(--md-sys-color-surface-container)}.pg{height:100%;box-sizing:border-box;overflow:auto;padding:24px;background:var(--md-sys-color-surface);border-radius:32px;color:var(--md-sys-color-on-surface)}h1{margin:0;font-size:30px;font-weight:500}.intro{margin:8px 0 20px;font-size:15px;line-height:1.5}.sources{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.source{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container-lowest);padding:16px}.source-icon{font-size:28px;color:var(--sg-brand-text)}h2{margin:0 0 5px;font-size:17px;font-weight:650}.copy p{margin:0;font-size:13px;line-height:1.45}.copy small{display:block;margin-top:5px;font-size:11px;color:var(--md-sys-color-on-surface-variant)}.go{display:inline-flex;align-items:center;justify-content:center;min-height:44px;box-sizing:border-box;background:var(--sg-brand-strong);color:#fff;border-radius:10px;padding:10px 12px;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}.note{font-size:12px;line-height:1.5;margin:18px 0 10px;color:var(--md-sys-color-on-surface-variant)}.places-link{display:inline-block;min-height:44px;line-height:44px;font-size:13px;color:var(--sg-brand-text)}a:focus-visible{outline:3px solid var(--sg-brand-text);outline-offset:3px}@media(max-width:767px){.pg{padding:18px 14px;border-radius:0}.sources{grid-template-columns:1fr}.source{gap:10px;padding:14px;grid-template-columns:28px minmax(0,1fr) auto}}
.featured{margin:0 0 24px}.featured>h2,.directories-heading{font-size:20px;margin:0 0 12px}.event-card{overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container-lowest);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.event-image{display:block;width:100%;height:100%;object-fit:cover}.event-copy{padding:16px}.event-copy h3{margin:0 0 6px;font-size:21px}.event-copy p{margin:8px 0;font-size:14px;line-height:1.5}.event-copy .event-meta{font-size:13px;color:var(--md-sys-color-on-surface-variant)}.event-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:12px}.event-footer .go{font-size:12px;padding:10px 11px}.event-footer{flex-wrap:nowrap}@media(max-width:359px){.event-footer{gap:6px}.event-footer .go{font-size:11px;padding:10px 9px}}@media(max-width:767px){.event-card{grid-template-columns:1fr}.event-image{aspect-ratio:16/9;height:auto}.event-copy{padding:14px}.event-copy h3{font-size:20px}}
</style>
