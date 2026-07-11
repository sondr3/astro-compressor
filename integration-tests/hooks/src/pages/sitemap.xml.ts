export async function GET(): Promise<Response> {
	const sitemap = await fetch("https://www.google.com/sitemap.xml")
	const body = await sitemap.text()
	return new Response(body, {
		headers: {
			"Content-Type": "application/xml",
		},
	})
}
