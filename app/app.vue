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
			<span slot="title" class="brand"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InQiPgogIDx0aXRsZSBpZD0idCI+VGhlcmVTRyAtIFNpbmdhcG9yZSBmbGFnIG1hcms8L3RpdGxlPgogIDxkZWZzPgogICAgPGNsaXBQYXRoIGlkPSJyciI+PHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTQiLz48L2NsaXBQYXRoPgogICAgPG1hc2sgaWQ9ImNyZXMiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgZmlsbD0id2hpdGUiLz48Y2lyY2xlIGN4PSIyMC41IiBjeT0iMTYuNSIgcj0iOC42IiBmaWxsPSJibGFjayIvPjwvbWFzaz4KICA8L2RlZnM+CiAgPGcgY2xpcC1wYXRoPSJ1cmwoI3JyKSI+CiAgICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNjQiIGhlaWdodD0iMzguNCIgZmlsbD0iI0U2MjMzMyIvPgogICAgPHJlY3QgeD0iMCIgeT0iMzguNCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjI1LjYiIGZpbGw9IiNmZmZmZmYiLz4KICA8L2c+CiAgPHJlY3QgeD0iMiIgeT0iMiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiByeD0iMTQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0MwMDAxRCIgc3Ryb2tlLW9wYWNpdHk9IjAuMjUiIHN0cm9rZS13aWR0aD0iMSIvPgogIDxjaXJjbGUgY3g9IjE2LjUiIGN5PSIxNi41IiByPSIxMC4yIiBmaWxsPSIjZmZmZmZmIiBtYXNrPSJ1cmwoI2NyZXMpIi8+CiAgPHBvbHlnb24gcG9pbnRzPSIyNy41MCw3LjAwIDI4LjEyLDguODUgMzAuMDcsOC44NyAyOC41MCwxMC4wMiAyOS4wOSwxMS44OCAyNy41MCwxMC43NSAyNS45MSwxMS44OCAyNi41MCwxMC4wMiAyNC45Myw4Ljg3IDI2Ljg4LDguODUiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjMzLjk3LDExLjcwIDM0LjU4LDEzLjU1IDM2LjU0LDEzLjU2IDM0Ljk3LDE0LjcyIDM1LjU1LDE2LjU4IDMzLjk3LDE1LjQ1IDMyLjM4LDE2LjU4IDMyLjk3LDE0LjcyIDMxLjQwLDEzLjU2IDMzLjM1LDEzLjU1IiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBvbHlnb24gcG9pbnRzPSIzMS41MCwxOS4zMCAzMi4xMSwyMS4xNSAzNC4wNiwyMS4xNyAzMi41MCwyMi4zMyAzMy4wOCwyNC4xOSAzMS41MCwyMy4wNSAyOS45MSwyNC4xOSAzMC41MCwyMi4zMyAyOC45MywyMS4xNyAzMC44OCwyMS4xNSIgZmlsbD0iI2ZmZmZmZiIvPgogIDxwb2x5Z29uIHBvaW50cz0iMjMuNTAsMTkuMzAgMjQuMTIsMjEuMTUgMjYuMDcsMjEuMTcgMjQuNTAsMjIuMzMgMjUuMDksMjQuMTkgMjMuNTAsMjMuMDUgMjEuOTIsMjQuMTkgMjIuNTAsMjIuMzMgMjAuOTQsMjEuMTcgMjIuODksMjEuMTUiIGZpbGw9IiNmZmZmZmYiLz4KICA8cG9seWdvbiBwb2ludHM9IjIxLjAzLDExLjcwIDIxLjY1LDEzLjU1IDIzLjYwLDEzLjU2IDIyLjAzLDE0LjcyIDIyLjYyLDE2LjU4IDIxLjAzLDE1LjQ1IDE5LjQ1LDE2LjU4IDIwLjAzLDE0LjcyIDE4LjQ2LDEzLjU2IDIwLjQyLDEzLjU1IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPgo=" alt="" width="32" height="32" /><span>ThereSG</span></span>
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

.brand { display: inline-flex; align-items: center; gap: 9px; vertical-align: middle; font-weight: 700; color: var(--sg-on-brand); letter-spacing: 0.2px; }
.brand img { width: 32px; height: 32px; border-radius: 8px; box-shadow: 0 0 0 2px rgb(255 255 255 / 0.95); }

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
