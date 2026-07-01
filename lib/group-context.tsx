'use client'
import { createContext, useContext } from 'react'
import type { GroupMember } from './types'

type GroupContextValue = {
  id: string
  slug: string
  name: string
  membership: GroupMember | null
}

export const GroupContext = createContext<GroupContextValue | null>(null)

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext)
  if (!ctx) throw new Error('useGroup must be used inside GroupProvider')
  return ctx
}
