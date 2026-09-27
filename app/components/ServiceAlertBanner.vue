<script setup lang="ts">
import type { TrainStatus } from '~~/shared/types/TrainStatus';

const { data: status } = useLazyFetch<TrainStatus>('/api/train-status', {
	server: false,
	key: 'train-status',
	getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
});

const expanded = ref(false);

const messages = computed(() => status.value?.messages ?? []);
const shownMessages = computed(() =>
	expanded.value ? messages.value : messages.value.slice(0, 1),
);
const hiddenCount = computed(() => messages.value.length - shownMessages.value.length);
</script>

<template>
	<div v-if="messages.length" class="banner" :class="{ disrupted: status?.disrupted }" role="alert">
		<Icon
			class="banner-icon"
			:name="
				status?.disrupted
					? 'material-symbols:warning-outline'
					: 'material-symbols:info-outline'
			"
		/>
		<div class="banner-body">
			<p v-for="(message, index) in shownMessages" :key="index" class="banner-text">
				{{ message.Content }}
			</p>
			<button
				v-if="hiddenCount > 0 || expanded"
				type="button"
				class="banner-toggle"
				@click="expanded = !expanded"
			>
				{{ expanded ? 'Show less' : `${hiddenCount} more alert${hiddenCount > 1 ? 's' : ''}` }}
			</button>
		</div>
		<span v-if="status?.hasBridging" class="bridging-chip">
			<Icon name="material-symbols:directions-bus-outline" />
			Shuttle / bridging buses
		</span>
	</div>
</template>

<style lang="css" scoped>
.banner {
	flex-shrink: 0;
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 8px 16px;
	box-sizing: border-box;
	width: 100%;
	background-color: var(--md-sys-color-tertiary-container);
	color: var(--md-sys-color-on-tertiary-container);
	font-size: 13px;
	line-height: 1.4;
}

.banner.disrupted {
	background-color: var(--md-sys-color-error-container);
	color: var(--md-sys-color-on-error-container);
}

.banner-icon {
	flex-shrink: 0;
	font-size: 18px;
	margin-top: 1px;
}

.banner-body {
	flex-grow: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.banner-text {
	margin: 0;
}

.banner-toggle {
	align-self: flex-start;
	border: 0;
	background: none;
	padding: 0;
	font: inherit;
	font-weight: 600;
	color: inherit;
	text-decoration: underline;
	cursor: pointer;
}

.bridging-chip {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 10px;
	border-radius: 999px;
	background-color: var(--md-sys-color-primary);
	color: var(--md-sys-color-on-primary);
	font-size: 12px;
	font-weight: 600;
	white-space: nowrap;
}

@media (max-width: 767px) {
	.banner {
		flex-wrap: wrap;
		padding: 8px 12px;
	}
}
</style>
