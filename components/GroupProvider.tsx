'use client'
import { GroupContext } from '@/lib/group-context'
import type { GroupMember } from '@/lib/types'

type Props = {
  group: { id: string; slug: string; name: string }
  membership: GroupMember | null
  children: React.ReactNode
}

export default function GroupProvider({ group, membership, children }: Props) {
  return (
    <GroupContext.Provider value={{ ...group, membership }}>
      {children}
    </GroupContext.Provider>
  )
}
