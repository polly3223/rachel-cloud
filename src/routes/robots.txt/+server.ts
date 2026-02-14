export const prerender = true;

export async function GET() {
	const body = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /onboarding
Disallow: /api

Sitemap: https://get-rachel.com/sitemap.xml`;

	return new Response(body.trim(), {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'max-age=3600'
		}
	});
}
