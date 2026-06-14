import { getGroupBySlug } from '@/lib/supabase-server'

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const group = await getGroupBySlug(params.slug)
  const manifest = {
    name: group ? `${group.name} — Summer Games` : 'Summer Games',
    short_name: group?.name ?? 'Summer Games',
    start_url: `/g/${params.slug}`,
    display: 'standalone',
    theme_color: '#1A4731',
    background_color: '#1A4731',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
  return Response.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
