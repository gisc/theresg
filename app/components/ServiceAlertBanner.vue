<script setup lang="ts">
import type { TrainStatus } from '~~/shared/types/TrainStatus';

const { data: status } = useLazyFetch<TrainStatus>('/api/train-status', {
	server: false,
	key: 'train-status',
	getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
});

const expanded = ref(false);
const collapsed = ref(false);

const messages = computed(() => status.value?.messages ?? []);

// Dismissal is keyed to the current set of alerts: the banner stays
// collapsed until a new or different alert appears. Client-side only.
const STORAGE_KEY = 'theresg-dismissed-alerts';
function alertKey(msgs: { Content: string }[]): string {
	const s = msgs.map((m) => m.Content).join('|');
	let h = 5381;
	for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
	return `a${(h >>> 0).toString(36)}`;
}
watch(
	messages,
	(msgs) => {
		if (!msgs.length) return;
		collapsed.value = localStorage.getItem(STORAGE_KEY) === alertKey(msgs);
	},
	{ immediate: true },
);
function dismiss() {
	localStorage.setItem(STORAGE_KEY, alertKey(messages.value));
	collapsed.value = true;
}
function reopen() {
	localStorage.removeItem(STORAGE_KEY);
	collapsed.value = false;
}
const shownMessages = computed(() =>
	expanded.value ? messages.value : messages.value.slice(0, 1),
);
const hiddenCount = computed(() => messages.value.length - shownMessages.value.length);
</script>

<template>
	<button
		v-if="messages.length && collapsed"
		type="button"
		class="banner-collapsed"
		:class="{ disrupted: status?.disrupted }"
		@click="reopen"
	>
		<Icon
			:name="
				status?.disrupted
					? 'material-symbols:warning-outline'
					: 'material-symbols:info-outline'
			"
		/>
		<span
			>{{ messages.length }} service alert{{ messages.length > 1 ? 's' : '' }}</span
		>
		<Icon name="material-symbols:expand-more" />
	</button>
	<div
		v-else-if="messages.length"
		class="banner"
		:class="{ disrupted: status?.disrupted }"
		role="alert"
	>
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
		<button type="button" class="banner-close" aria-label="Hide alerts" @click="dismiss">
			<Icon name="material-symbols:close" />
		</button>
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

.banner-collapsed {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	box-sizing: border-box;
	border: 0;
	padding: 4px 16px;
	background-color: var(--md-sys-color-tertiary-container);
	color: var(--md-sys-color-on-tertiary-container);
	font: inherit;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
}

.banner-collapsed.disrupted {
	background-color: var(--md-sys-color-error-container);
	color: var(--md-sys-color-on-error-container);
}

.banner-close {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	border: 0;
	background: none;
	padding: 2px;
	font-size: 16px;
	color: inherit;
	cursor: pointer;
	opacity: 0.7;
}

.banner-close:hover {
	opacity: 1;
}

@media (max-width: 767px) {
	.banner {
		flex-wrap: wrap;
		padding: 8px 12px;
	}
}
</style>
