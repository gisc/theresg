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
			<span slot="title" class="brand"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgcm9sZT0iaW1nIiBhcmlhLWxhYmVsbGVkYnk9InRpdGxlIj4KICA8dGl0bGUgaWQ9InRpdGxlIj5UcmFuc2l0U0cgY29sb3VyZnVsIHJhaWwgYW5kIGJ1cyByb3V0ZXM8L3RpdGxlPgogIDxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0ibmlnaHQiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agc3RvcC1jb2xvcj0iIzE1MzA1YSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzEwMjQ0NSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPgogIDxyZWN0IHg9IjIiIHk9IjIiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcng9IjE3IiBmaWxsPSJ1cmwoI25pZ2h0KSIvPgogIDxwYXRoIGQ9Ik0xMCA0M0MyMCA0MyAxNyAxOCAzMCAxOHM3IDI4IDI0IDI1IiBmaWxsPSJub25lIiBzdHJva2U9IiNmNmJlMzAiIHN0cm9rZS13aWR0aD0iNyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPHBhdGggZD0iTTEwIDI5YzExIDAgMTMgMTYgMjIgMTZzMTAtMjIgMjItMjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2VmNTk2YiIgc3Ryb2tlLXdpZHRoPSI3IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICA8cGF0aCBkPSJNMTEgNDNjMTEgMCAxNi0xMyAyMi0xM3MxMiAxMyAyMSAxMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzZjOWFkIiBzdHJva2Utd2lkdGg9IjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgogIDxjaXJjbGUgY3g9IjMyIiBjeT0iMzEiIHI9IjYuNSIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjMyIiBjeT0iMzEiIHI9IjIuNiIgZmlsbD0iIzE1MzA1YSIvPgogIDxjaXJjbGUgY3g9IjEwIiBjeT0iMjkiIHI9IjMuNiIgZmlsbD0iI2ZmZiIvPjxjaXJjbGUgY3g9IjU0IiBjeT0iMjMiIHI9IjMuNiIgZmlsbD0iI2ZmZiIvPgo8L3N2Zz4K" alt="" width="32" height="32" /><span>transitsg</span></span>
		</m3e-app-bar>
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
	--m3e-app-bar-container-color: var(--md-sys-color-surface-container);
}

.brand { display: inline-flex; align-items: center; gap: 9px; vertical-align: middle; font-weight: 700; }
.brand img { width: 32px; height: 32px; border-radius: 8px; }

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
