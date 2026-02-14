const prerender = true;
async function GET() {
  const baseUrl = "https://rachelcloud.com";
  const pages = [
    { url: "/", priority: "1.0", changefreq: "weekly" },
    { url: "/signup", priority: "0.8", changefreq: "monthly" },
    { url: "/login", priority: "0.5", changefreq: "monthly" }
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(
    (p) => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <priority>${p.priority}</priority>
    <changefreq>${p.changefreq}</changefreq>
  </url>`
  ).join("\n")}
</urlset>`;
  return new Response(sitemap.trim(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "max-age=3600"
    }
  });
}
export {
  GET,
  prerender
};
