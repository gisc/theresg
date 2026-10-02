<script setup lang="ts">
import type { M3eNavRailElement } from '@m3e/web/nav-rail';

const route = useRoute();

const router = useRouter();

const { isDark } = useTheme();

const { isBlue } = useBlueTheme();

const navRail = useTemplateRef<M3eNavRailElement>('navRail');

function toggleNavRail() {
	if (navRail.value?.mode === 'compact') {
		navRail.value.mode = 'expanded';
	} else if (navRail.value?.mode === 'expanded') {
		navRail.value.mode = 'compact';
	}
}

const routePath = computed(() => {
	return route.path.toLowerCase() || '';
});

useSeoMeta({
	description:
		'Live Singapore bus arrivals, MRT journey planner with fares, train and traffic alerts, platform crowd levels, bicycle parking, hawker centres and attractions.',
	ogTitle: 'ThereSG - Singapore public transport, live',
	ogDescription:
		'Live bus arrivals, MRT planner and fares, service alerts, crowd levels, bicycle parking, hawker food and attractions across Singapore.',
	ogType: 'website',
	ogUrl: 'https://www.there.sg',
	ogImage: 'https://www.there.sg/img/og-cover-v3.png',
	twitterCard: 'summary_large_image',
});
</script>

<template>
	<div id="content" class="content" :class="[isDark ? 'dark' : 'light', { blue: isBlue }]">
		<m3e-app-bar class="app-bar">
			<m3e-icon-button slot="leading" class="menu-button" @click="toggleNavRail()">
				<Icon name="material-symbols:menu-outline" />
			</m3e-icon-button>
			<span slot="title" class="brand" role="link" tabindex="0" @click="router.push('/')" @keydown.enter="router.push('/')"><img src="/icons/logo.svg?v=3" alt="" width="32" height="32" /><span>ThereSG</span></span>
		</m3e-app-bar>
		<ServiceAlertBanner />
		<div class="bottom">
			<m3e-nav-rail ref="navRail" class="nav-rail">
				<m3e-nav-item :selected.prop="routePath === '/'" @click="router.push('/')">
					<Icon slot="icon" name="material-symbols:home-outline" />
					Home
				</m3e-nav-item>
				<m3e-nav-item
					:selected.prop="routePath.startsWith('/bus')"
					@click="router.push('/bus')"
				>
					<Icon slot="icon" name="material-symbols:directions-bus-outline" />
					Bus
				</m3e-nav-item>
				<m3e-nav-item
					:selected.prop="routePath.startsWith('/mrt')"
					@click="router.push('/mrt')"
				>
					<Icon slot="icon" name="material-symbols:train-outline" />
					MRT
				</m3e-nav-item>

				<m3e-nav-item
					:selected.prop="routePath.startsWith('/bike')"
					@click="router.push('/bike')"
				>
					<Icon slot="icon" name="material-symbols:pedal-bike" />
					Bike
				</m3e-nav-item>

				<m3e-nav-item
					:selected.prop="routePath.startsWith('/food')"
					@click="router.push('/food')"
				>
					<Icon slot="icon" name="material-symbols:restaurant" />
					Food
				</m3e-nav-item>

				<m3e-nav-item
					:selected.prop="routePath.startsWith('/places')"
					@click="router.push('/places')"
				>
					<Icon slot="icon" name="material-symbols:attractions" />
					Places
				</m3e-nav-item>
			</m3e-nav-rail>
			<NuxtPage class="page" />
		</div>
		<m3e-nav-bar class="nav-bar">
			<m3e-nav-item :selected.prop="routePath === '/'" @click="router.push('/')">
				<Icon slot="icon" name="material-symbols:home-outline" />
				Home
			</m3e-nav-item>
			<m3e-nav-item
				:selected.prop="routePath.startsWith('/all')"
				@click="router.push('/all')"
			>
				<svg slot="icon" viewBox="-27 -16 54 48" width="27" height="24" fill="none" aria-hidden="true">
					<mask id="nav-route-ring" maskUnits="userSpaceOnUse" x="-27" y="-16" width="54" height="48">
						<rect x="-27" y="-16" width="54" height="48" fill="#fff" />
						<circle cx="18" cy="-6" r="7" fill="#000" />
					</mask>
					<path d="M-18 24 C-18 -4 18 22 18 -6" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" mask="url(#nav-route-ring)" />
					<circle cx="-18" cy="24" r="7" fill="currentColor" />
					<circle cx="18" cy="-6" r="7" stroke="currentColor" stroke-width="4.5" />
				</svg>
				Commute
			</m3e-nav-item>
			<m3e-nav-item
				:selected.prop="routePath.startsWith('/mrt')"
				@click="router.push('/mrt')"
			>
				<Icon slot="icon" name="material-symbols:train-outline" />
				MRT
			</m3e-nav-item>

			<m3e-nav-item
				:selected.prop="routePath.startsWith('/food')"
				@click="router.push('/food')"
			>
				<Icon slot="icon" name="material-symbols:restaurant" />
				Food
			</m3e-nav-item>

			<m3e-nav-item
				:selected.prop="routePath.startsWith('/places')"
				@click="router.push('/places')"
			>
				<Icon slot="icon" name="material-symbols:attractions" />
				Places
			</m3e-nav-item>
		</m3e-nav-bar>
	</div>
</template>

<style lang="css" scoped>
.content {
	display: flex;
	flex-direction: column;
	width: 100svw;
	height: 100svh;
	overflow: hidden;
}

.app-bar {
	flex-shrink: 0;
	--m3e-app-bar-container-color: var(--sg-brand);
	color: var(--sg-on-brand);
	padding-top: env(safe-area-inset-top);
}

/* Keep a recognisable shell while the custom elements upgrade on first load. */
.app-bar:not(:defined) {
	display: flex;
	align-items: center;
	box-sizing: border-box;
	min-height: 64px;
	padding-inline: 18px;
	background: var(--sg-brand);
}

.nav-rail:not(:defined),
.nav-bar:not(:defined) {
	visibility: hidden;
}

.nav-rail:not(:defined) {
	width: 96px;
}

.nav-bar:not(:defined) {
	height: 68px;
}

.menu-button {
	color: var(--sg-on-brand);
}

.brand {
	cursor: pointer; display: inline-flex; align-items: center; gap: 9px; vertical-align: middle; font-weight: 700; color: var(--sg-on-brand); letter-spacing: 0.2px; }
.brand img { width: 34px; height: 34px; border-radius: 9px; background: #fff; padding: 3px; box-sizing: border-box; }



.bottom {
	flex-grow: 1;
	display: flex;
	flex-direction: row;
	min-height: 0;
}

.nav-rail {
	flex-shrink: 0;
	background-color: var(--md-sys-color-surface-container);
}

.nav-bar {
	display: none;
	flex-shrink: 0;
	padding-bottom: env(safe-area-inset-bottom);
	--m3e-nav-bar-container-color: var(--md-sys-color-surface-container);
	/* Let items shrink on narrow phones instead of overflowing and clipping. */
	--m3e-nav-bar-vertical-item-width: min(64px, 16%);
	background-color: var(--md-sys-color-surface-container);
}

.page {
	flex-grow: 1;
	min-height: 0;
	min-width: 0;
}

@media (max-width: 767px) {
	.nav-rail {
		display: none;
	}

	.menu-button {
		display: none;
	}

	.nav-bar {
		display: flex;
	}
}
</style>
