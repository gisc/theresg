// Hidden blue-and-black theme , toggled by tapping the
// word "Enjoy" in the homepage quote. Invisible by design: no visual hint.
// Persisted in localStorage so it survives navigation and reloads.
const isBlue = ref<boolean>(false);
let blueInitialised = false;

export function useBlueTheme() {
	if (import.meta.client && !blueInitialised) {
		blueInitialised = true;
		isBlue.value = localStorage.getItem('theresg-blue-theme') === '1';
		watch(isBlue, (v) => {
			localStorage.setItem('theresg-blue-theme', v ? '1' : '0');
		});
	}

	function toggleBlue() {
		isBlue.value = !isBlue.value;
	}

	return { isBlue, toggleBlue };
}
