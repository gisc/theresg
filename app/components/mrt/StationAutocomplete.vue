<script setup lang="ts">
import type { StationInfo } from '~/utils/mrtRoute';

const props = defineProps<{
	label: string;
	stations: StationInfo[];
	modelValue: StationInfo | null;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: StationInfo | null];
}>();

const query = ref('');
const open = ref(false);

watch(
	() => props.modelValue,
	(value) => {
		query.value = value?.name ?? '';
	},
	{ immediate: true },
);

const matches = computed(() => {
	const q = query.value.trim().toLowerCase();
	if (!q || q === props.modelValue?.name.toLowerCase()) {
		return [];
	}

	return props.stations
		.filter(
			(s) =>
				s.name.toLowerCase().includes(q) ||
				s.codes.some((c) => c.code.toLowerCase().startsWith(q)),
		)
		.slice(0, 8);
});

function onInput(event: Event) {
	query.value = (event.target as HTMLInputElement).value;
	open.value = true;
	if (props.modelValue) {
		emit('update:modelValue', null);
	}
}

function select(station: StationInfo) {
	emit('update:modelValue', station);
	query.value = station.name;
	open.value = false;
}

function onBlur() {
	setTimeout(() => {
		open.value = false;
		query.value = props.modelValue?.name ?? '';
	}, 150);
}
</script>

<template>
	<div class="ac">
		<input
			class="ac-input"
			type="text"
			:placeholder="label"
			:aria-label="label"
			:value="query"
			autocomplete="off"
			@input="onInput"
			@focus="open = true"
			@blur="onBlur"
		/>
		<ul v-if="open && matches.length !== 0" class="ac-list">
			<li
				v-for="station in matches"
				:key="station.name"
				class="ac-item"
				@mousedown.prevent="select(station)"
			>
				<span class="ac-chips">
					<span
						v-for="c in station.codes"
						:key="c.line"
						class="chip"
						:style="{ backgroundColor: c.color, color: c.textColor }"
						>{{ c.code }}</span
					>
				</span>
				<span class="ac-name">{{ station.name }}</span>
			</li>
		</ul>
	</div>
</template>

<style lang="css" scoped>
.ac {
	position: relative;
	width: 100%;
	box-sizing: border-box;
}

.ac-input {
	width: 100%;
	box-sizing: border-box;
	padding: 12px 16px;
	font-size: 16px;
	font-family: inherit;
	color: var(--md-sys-color-on-surface);
	background-color: var(--md-sys-color-surface-container-low);
	border: 1px solid var(--md-sys-color-outline-variant);
	border-radius: 12px;
	outline: none;
}

.ac-input:focus {
	border-color: var(--md-sys-color-primary);
}

.ac-list {
	position: absolute;
	top: calc(100% + 4px);
	left: 0;
	right: 0;
	z-index: 20;
	margin: 0;
	padding: 4px;
	list-style: none;
	background-color: var(--md-sys-color-surface-container-highest);
	border-radius: 12px;
	box-shadow: 0 4px 16px rgb(0 0 0 / 0.25);
	max-height: 260px;
	overflow-y: auto;
}

.ac-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	border-radius: 8px;
	cursor: pointer;
	color: var(--md-sys-color-on-surface);
}

.ac-item:hover {
	background-color: var(--md-sys-color-surface-container-low);
}

.ac-chips {
	display: inline-flex;
	gap: 4px;
	flex-shrink: 0;
}

.chip {
	display: inline-block;
	padding: 2px 6px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	line-height: 1.4;
}
</style>
