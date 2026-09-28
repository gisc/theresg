<script setup lang="ts">
import type { M3eNavRailElement } from '@m3e/web/nav-rail';

const route = useRoute();

const router = useRouter();

const { isDark } = useTheme();

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
</script>

<template>
	<div id="content" class="content" :class="isDark ? 'dark' : 'light'">
		<m3e-app-bar class="app-bar">
			<m3e-icon-button slot="leading" class="menu-button" @click="toggleNavRail()">
				<Icon name="material-symbols:menu-outline" />
			</m3e-icon-button>
			<span slot="title" class="brand" role="link" tabindex="0" @click="router.push('/')" @keydown.enter="router.push('/')"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InQiPgogIDx0aXRsZSBpZD0idCI+VGhlcmVTRyAtIGJ1cyBhbmQgTVJUIHRyYWluIG1hcms8L3RpdGxlPgogIDxjaXJjbGUgY3g9IjMyIiBjeT0iMzIiIHI9IjMwIiBmaWxsPSIjZmZmZmZmIi8+CiAgPGc+CiAgICA8cmVjdCB4PSIxMCIgeT0iMTQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyNyIgcng9IjUiIGZpbGw9IiNFNjIzMzMiLz4KICAgIDxyZWN0IHg9IjEzLjQiIHk9IjE3LjgiIHdpZHRoPSIxMy4yIiBoZWlnaHQ9IjguNiIgcng9IjIiIGZpbGw9IiNmZmZmZmYiLz4KICAgIDxjaXJjbGUgY3g9IjE1LjQiIGN5PSIzMy42IiByPSIxLjkiIGZpbGw9IiNmZmZmZmYiLz4KICAgIDxjaXJjbGUgY3g9IjI0LjYiIGN5PSIzMy42IiByPSIxLjkiIGZpbGw9IiNmZmZmZmYiLz4KICAgIDxyZWN0IHg9IjEyIiB5PSI0MSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjMuNCIgcng9IjEuNyIgZmlsbD0iI0U2MjMzMyIvPgogIDwvZz4KICA8Zz4KICAgIDxwYXRoIGQ9Ik0zNy41IDE0IGgxMS41IGE1IDUgMCAwIDEgNSA1IHYxMi41IGwtNC4zIDguNiBoLTEyLjQgbC00LjMgLTguNiB2LTEyLjUgYTUgNSAwIDAgMSA1IC01IHoiIGZpbGw9IiNFNjIzMzMiLz4KICAgIDxyZWN0IHg9IjM3IiB5PSIxNy44IiB3aWR0aD0iMTMuMiIgaGVpZ2h0PSI3LjYiIHJ4PSIyIiBmaWxsPSIjZmZmZmZmIi8+CiAgICA8Y2lyY2xlIGN4PSIzOSIgY3k9IjMyLjQiIHI9IjEuOSIgZmlsbD0iI2ZmZmZmZiIvPgogICAgPGNpcmNsZSBjeD0iNDguMiIgY3k9IjMyLjQiIHI9IjEuOSIgZmlsbD0iI2ZmZmZmZiIvPgogICAgPGxpbmUgeDE9IjM3LjUiIHkxPSI0NCIgeDI9IjM0LjUiIHkyPSI0OSIgc3Ryb2tlPSIjRTYyMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogICAgPGxpbmUgeDE9IjUwIiB5MT0iNDQiIHgyPSI1MyIgeTI9IjQ5IiBzdHJva2U9IiNFNjIzMzMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPC9nPgo8L3N2Zz4K" alt="" width="32" height="32" /><span>ThereSG</span></span>
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
			</m3e-nav-rail>
			<NuxtPage class="page" />
		</div>
		<m3e-nav-bar class="nav-bar">
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

.menu-button {
	color: var(--sg-on-brand);
}

.brand {
	cursor: pointer; display: inline-flex; align-items: center; gap: 9px; vertical-align: middle; font-weight: 700; color: var(--sg-on-brand); letter-spacing: 0.2px; }
.brand img { width: 32px; height: 32px; border-radius: 50%; }

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
	--m3e-nav-bar-vertical-item-width: min(72px, 23%);
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
