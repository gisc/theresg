// Optional blue theme. Read after mount to keep initial hydration consistent.
const isBlue = ref<boolean>(false);
let blueInitialised = false;

export function useBlueTheme() {
	if (import.meta.client) {
		onMounted(() => {
			if (blueInitialised) {
				return;
			}
			blueInitialised = true;
			isBlue.value = localStorage.getItem('theresg-blue-theme') === '1';
			watch(isBlue, (v) => {
				localStorage.setItem('theresg-blue-theme', v ? '1' : '0');
			});
		});
	}

	function toggleBlue() {
		isBlue.value = !isBlue.value;
	}

	return { isBlue, toggleBlue };
}
