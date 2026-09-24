<script setup lang="ts">
const { data } = await useFetch<{
	message: string;
}>('/api/train-service-alerts');
</script>

<template>
	<p>{{ data }}</p>
</template>
