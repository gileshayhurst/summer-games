import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getGroupBySlug } from '@/lib/supabase-server'
import GroupProvider from '@/components/GroupProvider'
import GroupNav from '@/components/GroupNav'

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  return { manifest: `/g/${params.slug}/manifest.webmanifest` }
}

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const group = await getGroupBySlug(params.slug)
  if (!group) notFound()

  return (
    <GroupProvider group={{ id: group.id, slug: group.slug, name: group.name }}>
      <GroupNav slug={group.slug} groupName={group.name} />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </GroupProvider>
  )
}
