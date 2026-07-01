import type { Metadata } from 'next'
import { requireMembership } from '@/lib/auth'
import GroupProvider from '@/components/GroupProvider'
import GroupNav from '@/components/GroupNav'
import BottomNav from '@/components/BottomNav'

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
  const { group, member } = await requireMembership(params.slug)

  return (
    <GroupProvider group={{ id: group.id, slug: group.slug, name: group.name }} membership={member}>
      <GroupNav slug={group.slug} groupName={group.name} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">{children}</main>
      <BottomNav slug={group.slug} />
    </GroupProvider>
  )
}
