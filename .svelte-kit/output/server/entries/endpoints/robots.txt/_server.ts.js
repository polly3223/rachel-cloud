const prerender = true;
async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /onboarding
Disallow: /api

Sitemap: https://rachelcloud.com/sitemap.xml`;
  return new Response(body.trim(), {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "max-age=3600"
    }
  });
}
export {
  GET,
  prerender
};
