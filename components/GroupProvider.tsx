'use client'
import { GroupContext } from '@/lib/group-context'

type Props = {
  group: { id: string; slug: string; name: string }
  children: React.ReactNode
}

export default function GroupProvider({ group, children }: Props) {
  return <GroupContext.Provider value={group}>{children}</GroupContext.Provider>
}
