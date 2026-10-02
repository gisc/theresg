<script setup lang="ts">
export interface JourneyPlace {
	id: string;
	name: string;
	sub: string;
	kind: 'mrt' | 'bus' | 'hawker' | 'attraction' | 'park' | 'here';
	lat: number;
	lon: number;
	codes?: { code: string; color: string; textColor: string }[];
}

const props = defineProps<{
	label: string;
	places: JourneyPlace[];
	modelValue: JourneyPlace | null;
	canUseLocation?: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: JourneyPlace | null];
	'use-location': [];
	focused: [];
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
	if (q.length < 2 || q === props.modelValue?.name.toLowerCase()) return [];
	const starts: JourneyPlace[] = [];
	const contains: JourneyPlace[] = [];
	for (const p of props.places) {
		const n = p.name.toLowerCase();
		const hay = `${n} ${p.sub.toLowerCase()} ${p.codes?.map((c) => c.code.toLowerCase()).join(' ') ?? ''}`;
		if (n.startsWith(q) || p.codes?.some((c) => c.code.toLowerCase() === q) || p.id === `bus:${q}`) starts.push(p);
		else if (hay.includes(q)) contains.push(p);
		if (starts.length >= 8) break;
	}
	return [...starts, ...contains].slice(0, 8);
});

const kindLabel: Record<JourneyPlace['kind'], string> = {
	mrt: 'MRT station',
	bus: 'Bus stop',
	hawker: 'Hawker centre',
	attraction: 'Attraction',
	park: 'Park or library',
	here: 'My location',
};

function onInput(event: Event) {
	query.value = (event.target as HTMLInputElement).value;
	open.value = true;
	if (props.modelValue) emit('update:modelValue', null);
}

function select(place: JourneyPlace) {
	emit('update:modelValue', place);
	query.value = place.name;
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
			@focus="
				open = true;
				emit('focused');
			"
			@blur="onBlur"
		/>
		<ul v-if="open && (matches.length !== 0 || (canUseLocation && !modelValue && !query))" class="ac-list">
			<li
				v-if="canUseLocation && !modelValue && !query"
				class="ac-item"
				@mousedown.prevent="
					emit('use-location');
					open = false;
				"
			>
				<Icon name="material-symbols:my-location" />
				<span class="ac-name">Use my location</span>
			</li>
			<li v-for="p in matches" :key="p.id" class="ac-item" @mousedown.prevent="select(p)">
				<span v-if="p.codes?.length" class="ac-chips">
					<span
						v-for="c in p.codes"
						:key="c.code"
						class="chip"
						:style="{ backgroundColor: c.color, color: c.textColor }"
						>{{ c.code }}</span
					>
				</span>
				<span class="ac-name">{{ p.name }}</span>
				<span class="ac-sub">{{ p.sub || kindLabel[p.kind] }}</span>
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
	max-height: 300px;
	overflow-y: auto;
}
.ac-item {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4px 8px;
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
.ac-sub {
	flex-basis: 100%;
	font-size: 12px;
	color: var(--md-sys-color-on-surface-variant);
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
