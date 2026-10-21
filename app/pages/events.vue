<script setup lang="ts">
import { eventHasEnded } from '~~/shared/utils/event-archive';
definePageMeta({ title: 'Events' });
useSeoMeta({ title: 'Events', description: 'Find library programmes, community events, park activities and performances through official Singapore calendars.' });
type FeaturedEvent = {
	title: string;
	image: string;
	alt: string;
	meta: string;
	body: string;
	note?: string;
	readMore: string;
	commuteToId?: string;
	mrtTo?: string;
	endsOn: string; // YYYY-MM-DD, featured through this date in Singapore time
};
const featuredEvents: FeaturedEvent[] = [
	{
		title: 'Spookology 2026',
		image: '/img/spookology-illustration.webp',
		alt: 'Illustration of young investigators with flashlights following glowing footprints toward a giant spider silhouette in a dark science museum gallery',
		meta: 'Science Centre Singapore · 27 Oct–1 Nov 2026, day 10am–5pm · Afterdark 30–31 Oct, 7–11pm',
		body: 'A CSI-style Glitch in the Web trail through four Fear Labs, plus Robo Trick or Treat and a best-dressed contest. Afterdark nights add DJs, an Omni-Theatre horror film (PG13) and stargazing. Spookology Juniors runs at KidsSTOP for ages 8 and below. Day admission: Singaporeans/PRs $10 adult, $6 child/senior; standard rates $20 adult, $12 child/senior. Afterdark web special: $25, usual price $40. Check the official page for ticket conditions and availability.',
		readMore: 'https://www.science.edu.sg/whats-on/spookology',
		commuteToId: 'a:Science Centre Singapore',
		mrtTo: 'Jurong East',
		endsOn: '2026-11-01',
	},
	{
		title: 'Haw Ror Villa 5',
		image: '/img/haw-ror-villa-illustration.webp',
		alt: 'Illustration of a lantern-lit Chinese garden gateway with mist and playful ghost silhouettes',
		meta: 'Haw Par Villa · 8 Oct–15 Nov 2026, select nights',
		body: "Four scare zones, a puzzle hunt and a maze experience at Hell's Museum's Halloween event.",
		readMore: 'https://cnalifestyle.channelnewsasia.com/living/haw-ror-villa-5-halloween-589881',
		commuteToId: 'a:Haw Par Villa',
		mrtTo: 'Haw Par Villa',
		endsOn: '2026-11-15',
	},
	{
		title: '2026 BYD Singapore International Marathon',
		image: '/img/sgim-illustration.webp',
		alt: 'Concept illustration of runners on a Marina Bay waterfront road at sunrise with the National Stadium dome and city skyline behind',
		meta: '4-6 Dec 2026 · BYD Marathon Sun 6 Dec: start F1 Pit Building, finish National Stadium',
		body: "Singapore's national marathon weekend, from the 42.195km BYD Marathon to the 10KM, 5KM and Kids Dash. BYD Marathon availability differs across the organiser's pages, so check current registration. The events page says 10KM, 5KM and Kids Dash registration runs to 31 Oct 2026, or until full, while the homepage still says registration closes 30 Sep. Free early MRT runs on race morning from 2:30am.",
		note: 'Concept illustration, not the race route.',
		readMore: 'https://singaporeinternationalmarathon.com/',
		mrtTo: 'Stadium',
		endsOn: '2026-12-06',
	},
];
const now = Date.now();
const upcoming = featuredEvents.filter((event) => !eventHasEnded(event.endsOn, now)).sort((a, b) => a.endsOn.localeCompare(b.endsOn));
const past = featuredEvents.filter((event) => eventHasEnded(event.endsOn, now)).sort((a, b) => b.endsOn.localeCompare(a.endsOn));
const sources = [
 { name: 'AI community', icon: 'material-symbols:psychology-outline', description: 'Lorong AI talks, workshops and community events. Check each listing for venue and registration.', publisher: 'Lorong AI on Luma', url: 'https://luma.com/lorong-ai' },
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
<article v-for="event in upcoming" :key="event.title" class="event-card">
<img :src="event.image" :alt="event.alt" class="event-image" />
<div class="event-copy"><h3>{{event.title}}</h3><p class="event-meta">{{event.meta}}</p><p>{{event.body}}</p><p v-if="event.note" class="event-meta">{{event.note}}</p><div class="event-footer"><a :href="event.readMore" class="go" target="_blank" rel="noopener noreferrer">Read more ↗</a><NuxtLink v-if="event.commuteToId" :to="`/all?toId=${encodeURIComponent(event.commuteToId)}`" class="go">Commute</NuxtLink><NuxtLink v-if="event.mrtTo" :to="`/mrt?to=${encodeURIComponent(event.mrtTo)}`" class="go">By MRT</NuxtLink></div></div>
</article>
</section>
<section v-if="past.length" class="past" aria-labelledby="past-heading">
<h2 id="past-heading" class="directories-heading">Past events</h2>
<article v-for="event in past" :key="event.title" class="past-event">
<div class="past-copy"><h3>{{event.title}}</h3><p class="event-meta">{{event.meta}}</p><p>{{event.body}}</p></div>
<a :href="event.readMore" class="go" target="_blank" rel="noopener noreferrer" :aria-label="`Read more about ${event.title} (opens in a new tab)`">Read more ↗</a>
</article>
</section>
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
.featured{margin:0 0 24px}.featured>h2,.directories-heading{font-size:20px;margin:0 0 12px}.event-card{overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container-lowest);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.event-card+.event-card{margin-top:16px}.event-image{display:block;width:100%;height:100%;object-fit:cover}.event-copy{padding:16px}.event-copy h3{margin:0 0 6px;font-size:21px}.event-copy p{margin:8px 0;font-size:14px;line-height:1.5}.event-copy .event-meta{font-size:13px;color:var(--md-sys-color-on-surface-variant)}.event-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin-top:12px}.event-footer .go{font-size:12px;padding:10px 11px}.event-footer{flex-wrap:nowrap}@media(max-width:359px){.event-footer{gap:6px}.event-footer .go{font-size:11px;padding:10px 9px}}@media(max-width:767px){.event-card{grid-template-columns:1fr}.event-image{aspect-ratio:16/9;height:auto}.event-copy{padding:14px}.event-copy h3{font-size:20px}}
.past{margin:0 0 24px}.past-event{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container-lowest);padding:16px}.past-event+.past-event{margin-top:12px}.past-copy h3{margin:0 0 5px;font-size:17px;font-weight:650}.past-copy p{margin:4px 0;font-size:13px;line-height:1.45}.past-copy .event-meta{font-size:12px;color:var(--md-sys-color-on-surface-variant)}.past-event .go{font-size:12px;padding:10px 11px}@media(max-width:767px){.past-event{gap:10px;padding:14px}}
</style>
