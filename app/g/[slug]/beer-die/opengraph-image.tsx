import { ImageResponse } from 'next/og'
import { getGroupBySlug } from '@/lib/supabase-server'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: { slug: string } }) {
  const group = await getGroupBySlug(params.slug)
  const groupName = group?.name ?? 'Garage League'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 80 }}>🎲</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#ffffff', marginTop: 24 }}>
          {groupName}
        </div>
        <div style={{ fontSize: 28, color: '#94a3b8', marginTop: 12 }}>
          Beer Die Leaderboard
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
