<script setup lang="ts">
import type { TrainServiceMessage } from '~~/shared/types/TrainServiceMessage';

definePageMeta({
	title: 'Home',
});

useSeoMeta({
	title: 'Home',
});

const { data } = await useFetch<TrainServiceMessage[]>('/api/train-service-alerts');
</script>

<template>
	<div class="bg">
		<div class="pg">
			<m3e-heading class="heading" variant="headline" size="large"
				>Service Alerts</m3e-heading
			>
			<m3e-card>
				<m3e-list slot="content" variant="segmented">
					<m3e-list-item v-for="alert in data" :key="alert.Content">
						<m3e-avatar slot="leading">
							<Icon :name="getAlertIcon(alert.Content)" />
						</m3e-avatar>
						<span slot="overline">{{ alert.CreatedDate }}</span>
						{{ alert.Content }}
					</m3e-list-item>
				</m3e-list>
			</m3e-card>
		</div>
	</div>
</template>

<style lang="css" scoped>
.bg {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	background-color: var(--md-sys-color-surface-container);
}

.pg {
	width: 100%;
	height: 100%;
	overflow-y: scroll;
	background-color: var(--md-sys-color-surface);
	border-radius: 32px;
	padding: 16px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.pg::-webkit-scrollbar {
	display: none;
}

.heading {
	color: var(--md-sys-color-on-surface);
}
</style>
