export interface FavouriteStop {
	code: string;
	name: string;
	road: string;
}

const STORAGE_KEY = 'transitsg:favourite-stops';

let initialised = false;

export function useFavouriteStops() {
	const favourites = useState<FavouriteStop[]>('favourite-stops', () => []);

	if (import.meta.client && !initialised) {
		initialised = true;
		try {
			const raw = window.localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					favourites.value = parsed.filter(
						(s) => s && typeof s.code === 'string' && typeof s.name === 'string',
					);
				}
			}
		} catch {
			// Corrupt or unavailable storage: start empty.
		}
		watch(
			favourites,
			(value) => {
				try {
					window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
				} catch {
					// Storage full or blocked: keep in-memory only.
				}
			},
			{ deep: true },
		);
	}

	function isFavourite(code: string) {
		return favourites.value.some((s) => s.code === code);
	}

	function toggleFavourite(stop: FavouriteStop) {
		if (isFavourite(stop.code)) {
			favourites.value = favourites.value.filter((s) => s.code !== stop.code);
		} else {
			favourites.value = [
				...favourites.value,
				{ code: stop.code, name: stop.name, road: stop.road },
			];
		}
	}

	function removeFavourite(code: string) {
		favourites.value = favourites.value.filter((s) => s.code !== code);
	}

	return { favourites, isFavourite, toggleFavourite, removeFavourite };
}
