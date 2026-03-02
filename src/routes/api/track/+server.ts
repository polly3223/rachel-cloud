/**
 * Analytics proxy — forwards tracking events to local Munin instance.
 * This runs server-side so the Munin API stays on localhost (never exposed).
 * The browser sends events here, and we proxy them to Munin's public endpoint.
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MUNIN_URL = 'http://localhost:3001';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const type = body.type || 'PageView';

		// Forward to Munin's public endpoint with original headers for origin check
		const res = await fetch(`${MUNIN_URL}/api/public/${encodeURIComponent(type)}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Origin': 'https://get-rachel.com',
				'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown',
			},
			body: JSON.stringify({ data: body.data }),
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({ error: 'Unknown' }));
			return json(err, { status: res.status });
		}

		return json(await res.json(), { status: 201 });
	} catch (err) {
		console.error('Track proxy error:', err);
		return json({ error: 'Tracking failed' }, { status: 500 });
	}
};
