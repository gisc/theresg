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
			<span slot="title">{{
				($route.meta.title as string).toLowerCase() === 'home'
					? 'transitsg'
					: $route.meta.title
			}}</span>
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
