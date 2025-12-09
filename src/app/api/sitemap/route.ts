export async function GET() {
  return new Response('Sitemap endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
