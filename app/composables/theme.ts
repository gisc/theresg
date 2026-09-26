const isDark = ref<boolean>(false);

export function useTheme() {
	if (import.meta.client) {
		watchEffect((onInvalidate) => {
			const query = window.matchMedia('(prefers-color-scheme: dark)');

			if (query.matches !== isDark.value) {
				isDark.value = query.matches;
			}

			const onChange = () => {
				isDark.value = query.matches;
			};

			query.addEventListener('change', onChange);

			onInvalidate(() => {
				query.removeEventListener('change', onChange);
			});
		});
	}

	return { isDark };
}
