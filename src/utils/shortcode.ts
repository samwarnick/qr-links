const VALID_CHARACTERS =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';

export function generateShortcode(length = 6): string {
	let result = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * VALID_CHARACTERS.length);
		result += VALID_CHARACTERS.charAt(randomIndex);
	}

	return result;
}
