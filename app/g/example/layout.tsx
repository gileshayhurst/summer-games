import type { Metadata } from 'next'
import GroupNav from '@/components/GroupNav'
import BottomNav from '@/components/BottomNav'
import { EXAMPLE_GROUP_NAME } from './data'

export const metadata: Metadata = {
  title: `${EXAMPLE_GROUP_NAME} — Example`,
  description: 'See how Garage League looks for your crew',
}

export default function ExampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GroupNav slug="example" groupName={EXAMPLE_GROUP_NAME} isExample={true} />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-28 md:pb-8">{children}</main>
      <BottomNav slug="example" isExample={true} />
    </>
  )
}
