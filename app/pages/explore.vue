<script setup lang="ts">
await navigateTo({ path: '/places', query: useRoute().query, hash: useRoute().hash }, { redirectCode: 301, replace: true });
</script>
<template><div /></template>
