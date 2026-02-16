import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const session = event.locals.session;
	if (!session) {
		throw redirect(302, '/login');
	}

	return {
		user: {
			telegramId: session.telegramId,
			firstName: session.firstName,
			lastName: session.lastName,
			username: session.username,
			photoUrl: session.photoUrl,
		}
	};
};
